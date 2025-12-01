import { SimulationConfig } from '../types';

interface Ripple {
  x: number;
  y: number;
  age: number;
  strength: number;
}

export class ParticleEngine {
  public canvas: HTMLCanvasElement;
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

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.config = config;
    this.resize(canvas.width, canvas.height);
    this.initParticles();
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public setConfig(newConfig: SimulationConfig) {
    // Check if we need to re-init particles (if counts changed)
    const countsChanged = 
      newConfig.atomCounts.length !== this.config.atomCounts.length ||
      newConfig.atomCounts.some((c, i) => c !== this.config.atomCounts[i]);

    this.config = newConfig;

    if (countsChanged) {
      this.initParticles();
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
    // Only trigger if enabled
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
    // Pre-calculate friction factor: v *= (1 - friction)
    const velocityRetention = Math.max(0, 1 - friction); 

    // Apply Ripples
    const RIPPLE_SPEED = 6.0;
    const RIPPLE_WIDTH = 30;

    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const ripple = this.ripples[r];
      ripple.age++;
      
      const currentRadius = ripple.age * RIPPLE_SPEED;
      // Decay strength over time
      ripple.strength *= 0.95;

      // Remove dead ripples
      if (ripple.strength < 0.05 || ripple.age > 300) {
        this.ripples.splice(r, 1);
        continue;
      }

      const waveStrength = ripple.strength * 5.0; // Scale up for noticeable effect

      // Apply ripple force to all particles
      for (let i = 0; i < this.numParticles; i++) {
        let dx = this.x[i] - ripple.x;
        let dy = this.y[i] - ripple.y;

        // Correct for torus topology for ripples is tricky visually, 
        // so we usually just do local ripples or explicit wrap.
        // For simplicity, let's treat ripples as non-wrapping local events 
        // or apply the nearest wrap distance.
        if (dx > this.width * 0.5) dx -= this.width;
        if (dx < -this.width * 0.5) dx += this.width;
        if (dy > this.height * 0.5) dy -= this.height;
        if (dy < -this.height * 0.5) dy += this.height;

        const distSq = dx*dx + dy*dy;
        const dist = Math.sqrt(distSq);

        // If particle is within the wave front
        const distFromWave = Math.abs(dist - currentRadius);
        if (distFromWave < RIPPLE_WIDTH) {
           // Normalised distance within width (0 to 1)
           const intensity = 1 - (distFromWave / RIPPLE_WIDTH);
           // Push away
           if (dist > 0.001) {
             const pushX = (dx / dist) * intensity * waveStrength;
             const pushY = (dy / dist) * intensity * waveStrength;
             this.vx[i] += pushX;
             this.vy[i] += pushY;
           }
        }
      }
    }

    // Particle Interactions O(N^2)
    for (let i = 0; i < this.numParticles; i++) {
      let fx = 0;
      let fy = 0;
      const groupA = this.group[i];

      for (let j = 0; j < this.numParticles; j++) {
        if (i === j) continue;
        
        let dx = this.x[j] - this.x[i];
        let dy = this.y[j] - this.y[i];

        // Wrap around (Toroidal boundary)
        if (dx > this.width * 0.5) dx -= this.width;
        if (dx < -this.width * 0.5) dx += this.width;
        if (dy > this.height * 0.5) dy -= this.height;
        if (dy < -this.height * 0.5) dy += this.height;

        const distSq = dx*dx + dy*dy;
        
        if (distSq > 0 && distSq < rMaxSq) {
          const dist = Math.sqrt(distSq);
          const f = this.interactionForce(dist / rMax, interactionMatrix[groupA][this.group[j]]);
          
          const force = f * factor;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      this.vx[i] = (this.vx[i] * velocityRetention) + (fx * timeScale);
      this.vy[i] = (this.vy[i] * velocityRetention) + (fy * timeScale);
    }

    // Apply Velocity
    for (let i = 0; i < this.numParticles; i++) {
      this.x[i] += this.vx[i] * timeScale;
      this.y[i] += this.vy[i] * timeScale;

      // Wrap positions
      if (this.x[i] < 0) this.x[i] += this.width;
      if (this.x[i] >= this.width) this.x[i] -= this.width;
      if (this.y[i] < 0) this.y[i] += this.height;
      if (this.y[i] >= this.height) this.y[i] -= this.height;
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
    // Clear
    this.ctx.fillStyle = '#0f172a'; // Match body background
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Ripples
    this.ctx.lineWidth = 2;
    for (const ripple of this.ripples) {
      const radius = ripple.age * 6.0; // Match speed in update
      const alpha = Math.max(0, Math.min(1, ripple.strength));
      this.ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw Particles
    for (let g = 0; g < this.config.colors.length; g++) {
      if (this.config.atomCounts[g] === 0) continue;
      
      this.ctx.fillStyle = this.config.colors[g];
      this.ctx.beginPath();
      
      const start = this.groupOffsets[g];
      const end = this.groupOffsets[g+1];

      for (let i = start; i < end; i++) {
        const px = this.x[i];
        const py = this.y[i];
        // Using rect is faster than arc for thousands of particles
        this.ctx.rect(px - 1.5, py - 1.5, 3, 3);
      }
      this.ctx.fill();
    }
  }
}