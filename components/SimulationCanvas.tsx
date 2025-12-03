
import React, { useEffect, useRef } from 'react';
import { SimulationConfig } from '../types';
import ParticleEngine from '../classes/ParticleEngine';

interface SimulationCanvasProps {
  config: SimulationConfig;
  isPlaying: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ config, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);

  // Initialize Engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      // Initialize the engine with the canvas and initial config
      engineRef.current = new ParticleEngine(canvasRef.current, config);
    }

    // Cleanup on unmount
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []); // Run once on mount to setup the engine instance

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        // Update canvas display size
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        // Update engine physics world size
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    
    // Initial size set
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Config Updates
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setConfig(config);
    }
  }, [config]);

  // Handle Play/Pause
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPlaying(isPlaying);
    }
  }, [isPlaying]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!engineRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    engineRef.current.triggerRipple(x, y);
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="block absolute inset-0 w-full h-full bg-slate-900 cursor-crosshair active:cursor-grabbing"
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
    />
  );
};
