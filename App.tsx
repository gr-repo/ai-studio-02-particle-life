import React, { useState, useCallback } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { SimulationConfig, DEFAULT_COLORS } from './types';

const INITIAL_CONFIG: SimulationConfig = {
  atomCounts: [400, 400, 400, 400, 0, 0], // Start with 4 active types
  colors: DEFAULT_COLORS,
  // Random-ish initial matrix
  interactionMatrix: [
    [ 1.0, -0.1,  0.2, -0.3, 0, 0],
    [-0.1,  1.0, -0.1,  0.2, 0, 0],
    [ 0.2, -0.1,  1.0, -0.1, 0, 0],
    [-0.3,  0.2, -0.1,  1.0, 0, 0],
    [ 0.0,  0.0,  0.0,  0.0, 0, 0],
    [ 0.0,  0.0,  0.0,  0.0, 0, 0]
  ],
  friction: 0.2,
  timeScale: 0.4,
  cutOffRadius: 80,
  forceFactor: 0.6,
  rippleStrength: 2.0,
};

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
  const [isPlaying, setIsPlaying] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleReset = useCallback(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f172a]">
      <SimulationCanvas 
        key={resetTrigger} 
        config={config} 
        isPlaying={isPlaying} 
      />
      
      <ControlPanel 
        config={config} 
        setConfig={setConfig} 
        onReset={handleReset}
      />

      <div className="absolute bottom-6 left-6 pointer-events-none text-slate-500 text-sm z-10 select-none">
        <p>Particle Life Simulation</p>
        <p className="opacity-50">Inspired by Jeffrey Ventrella & Tom G</p>
      </div>
    </div>
  );
};

export default App;