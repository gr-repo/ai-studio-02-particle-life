
import { SimulationConfig } from '../types';

interface Ripple {
  x: number;
  y: number;
  age: number;
  strength: number;
}

export default class ParticleEngine {
  public ctx: CanvasRenderingContext2D;
  
  // Physics State
  private x: Float32Array;
  private y: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private group: Uint8Array;
  private numParticles: number = 0;

  // Interaction State
  private ripples: Ripple[] = [];

  // Config Cache
  private config: SimulationConfig;
  private width: number = 0;
  private height: number = 0;
  private groupOffsets: number[] = [];

  private isPlaying: boolean = true;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.config = config;
    this.resize(canvas.width, canvas.height);
    this.initParticles();
    this.loop();
  }

  public destroy() {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
    
    if (!this.isPlaying) {
      this.draw();
    }
  }

  public setConfig(newConfig: SimulationConfig) {
    const countsChanged = 
      newConfig.atomCounts.length !== this.config.atomCounts.length ||
      newConfig.atomCounts.some((c, i) => c !== this.config.atomCounts[i]);

    this.config = newConfig;

    if (countsChanged) {
      this.initParticles();
    } else if (!this.isPlaying) {
      this.draw();
    }
  }

  public setPlaying(playing: boolean) {
    this.isPlaying = playing;
    if (playing && !this.animationId) {
      this.loop();
    } else if (!playing && this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public initParticles() {
    let total = 0;
    this.groupOffsets = [0];
    this.config.atomCounts.forEach(c => {
      total += c;
      this.groupOffsets.push(total);
    });

    this.numParticles = total;
    this.x = new Float32Array(total);
    this.y = new Float32Array(total);
    this.vx = new Float32Array(total);
    this.vy = new Float32Array(total);
    this.group = new Uint8Array(total);

    let idx = 0;
    for (let g = 0; g < this.config.atomCounts.length; g++) {
      for (let i = 0; i < this.config.atomCounts[g]; i++) {
        this.x[idx] = Math.random() * this.width;
        this.y[idx] = Math.random() * this.height;
        this.vx[idx] = 0;
        this.vy[idx] = 0;
        this.group[idx] = g;
        idx++;
      }
    }
  }

  public triggerRipple(x: number, y: number) {
    if (this.config.rippleStrength > 0) {
      this.ripples.push({ 
        x, 
        y, 
        age: 0, 
        strength: this.config.rippleStrength 
      });
    }
  }

  public update() {
    const { interactionMatrix, cutOffRadius, forceFactor, friction, timeScale } = this.config;
    const rMax = cutOffRadius;
    const rMaxSq = rMax * rMax;
    const factor = forceFactor;
    const velocityRetention = Math.max(0, 1 - friction); 

    // Apply Ripples
    const RIPPLE_SPEED = 6.0;
    const RIPPLE_WIDTH = 30;

    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const ripple = this.ripples[r];
      ripple.age++;
      
      const currentRadius = ripple.age * RIPPLE_SPEED;
      ripple.strength *= 0.95;

      if (ripple.strength < 0.05 || ripple.age > 300) {
        this.ripples.splice(r, 1);
        continue;
      }

      const waveStrength = ripple.strength * 5.0;

      for (let i = 0; i < this.numParticles; i++) {
        let dx = this.x[i] - ripple.x;
        let dy = this.y[i] - ripple.y;

        if (dx > this.width * 0.5) dx -= this.width;
        if (dx < -this.width * 0.5) dx += this.width;
        if (dy > this.height * 0.5) dy -= this.height;
        if (dy < -this.height * 0.5) dy += this.height;

        const distSq = dx*dx + dy*dy;
        const dist = Math.sqrt(distSq);

        const distFromWave = Math.abs(dist - currentRadius);
        if (distFromWave < RIPPLE_WIDTH) {
           const intensity = 1 - (distFromWave / RIPPLE_WIDTH);
           if (dist > 0.001) {
             const pushX = (dx / dist) * intensity * waveStrength;
             const pushY = (dy / dist) * intensity * waveStrength;
             this.vx[i] += pushX;
             this.vy[i] += pushY;
           }
        }
      }
    }

    // Particle Interactions
    const x = this.x;
    const y = this.y;
    const vx = this.vx;
    const vy = this.vy;
    const group = this.group;
    const numParticles = this.numParticles;
    const width = this.width;
    const height = this.height;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    for (let i = 0; i < numParticles; i++) {
      let fx = 0;
      let fy = 0;
      const groupA = group[i];

      for (let j = 0; j < numParticles; j++) {
        if (i === j) continue;
        
        let dx = x[j] - x[i];
        let dy = y[j] - y[i];

        if (dx > halfWidth) dx -= width;
        else if (dx < -halfWidth) dx += width;
        if (dy > halfHeight) dy -= height;
        else if (dy < -halfHeight) dy += height;

        const distSq = dx*dx + dy*dy;
        
        if (distSq > 0 && distSq < rMaxSq) {
          const dist = Math.sqrt(distSq);
          const f = this.interactionForce(dist / rMax, interactionMatrix[groupA][group[j]]);
          
          const force = f * factor;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      vx[i] = (vx[i] * velocityRetention) + (fx * timeScale);
      vy[i] = (vy[i] * velocityRetention) + (fy * timeScale);
    }

    for (let i = 0; i < numParticles; i++) {
      x[i] += vx[i] * timeScale;
      y[i] += vy[i] * timeScale;

      if (x[i] < 0) x[i] += width;
      else if (x[i] >= width) x[i] -= width;
      if (y[i] < 0) y[i] += height;
      else if (y[i] >= height) y[i] -= height;
    }
  }

  private interactionForce(dist: number, g: number): number {
    const beta = 0.3;
    if (dist < beta) {
      return (dist / beta) - 1;
    } else if (beta < dist && dist < 1) {
       return g * (1 - Math.abs(2 * dist - 1 - beta) / (1 - beta));
    }
    return 0;
  }

  public draw() {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.lineWidth = 2;
    for (const ripple of this.ripples) {
      const radius = ripple.age * 6.0;
      const alpha = Math.max(0, Math.min(1, ripple.strength));
      this.ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    for (let g = 0; g < this.config.colors.length; g++) {
      if (this.config.atomCounts[g] === 0) continue;
      
      this.ctx.fillStyle = this.config.colors[g];
      this.ctx.beginPath();
      
      const start = this.groupOffsets[g];
      const end = this.groupOffsets[g+1];

      for (let i = start; i < end; i++) {
        const px = this.x[i];
        const py = this.y[i];
        this.ctx.rect(px - 1.5, py - 1.5, 3, 3);
      }
      this.ctx.fill();
    }
  }

  public loop = () => {
    if (!this.isPlaying) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  }
}
