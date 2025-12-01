import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { ParticleEngine } from '../classes/ParticleEngine';
import { SimulationConfig } from '../types';

interface SimulationCanvasProps {
  config: SimulationConfig;
  isPlaying: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ config, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const frameIdRef = useRef<number>(0);

  // Initialize Engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new ParticleEngine(canvasRef.current, config);
      
      // Critical: Resize to full screen immediately, then re-distribute particles
      // otherwise they bunch up in the top-left 300x150 default canvas area.
      engineRef.current.resize(window.innerWidth, window.innerHeight);
      engineRef.current.initParticles(); 
    }
  }, []);

  // Handle Resize
  useLayoutEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        engineRef.current.resize(window.innerWidth, window.innerHeight);
        // If paused, we still want to redraw once to show updated size
        if (!isPlaying) engineRef.current.draw();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPlaying]);

  // Handle Config Updates
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setConfig(config);
      if (!isPlaying) engineRef.current.draw();
    }
  }, [config, isPlaying]);

  // Game Loop
  useEffect(() => {
    const loop = () => {
      if (engineRef.current) {
        engineRef.current.update();
        engineRef.current.draw();
      }
      frameIdRef.current = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      frameIdRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frameIdRef.current);
    }

    return () => cancelAnimationFrame(frameIdRef.current);
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block absolute inset-0 w-full h-full bg-slate-900"
    />
  );
};