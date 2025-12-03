import React, { useState } from 'react';
import { RefreshCw, ChevronRight, Settings2, Shuffle } from 'lucide-react';
import { SimulationConfig } from '../types';
import { RuleMatrix } from './RuleMatrix';

interface ControlPanelProps {
  config: SimulationConfig;
  setConfig: (c: SimulationConfig) => void;
  onReset: () => void; // Resets positions but keeps rules
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  config, setConfig, onReset 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleRandomize = () => {
    // Generate random symmetric-ish matrix
    const newMatrix = config.interactionMatrix.map(row => 
      row.map(() => Math.random() * 2 - 1)
    );
    setConfig({ ...config, interactionMatrix: newMatrix });
  };

  const togglePanel = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <button 
        onClick={togglePanel}
        className="fixed top-4 right-4 z-50 p-3 bg-slate-800 text-slate-200 rounded-lg shadow-xl hover:bg-slate-700 transition-colors"
      >
        <Settings2 size={28} />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-sm border-l border-slate-800 text-slate-200 shadow-2xl overflow-y-auto z-50 transition-all">
      <div className="p-6 space-y-7">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Particle Life
          </h1>
          <button onClick={togglePanel} className="p-1.5 hover:bg-slate-800 rounded">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
             onClick={handleRandomize}
             className="flex-1 py-3 bg-white text-black hover:bg-slate-200 rounded text-base font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Shuffle size={20} /> Randomize Rules
          </button>
          <button 
            onClick={onReset}
            className="px-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            title="Respawn Particles"
          >
            <RefreshCw size={22} />
          </button>
        </div>

        {/* Matrix Editor */}
        <RuleMatrix config={config} onChange={setConfig} />

        <div className="space-y-5">
           <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Global Parameters</h3>
           
           {/* Sliders */}
           <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Friction</span>
                <span>{config.friction.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="0.9" step="0.01" 
                value={config.friction}
                onChange={(e) => setConfig({...config, friction: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

           <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Interaction Radius</span>
                <span>{config.cutOffRadius} px</span>
              </div>
              <input 
                type="range" min="10" max="200" step="1" 
                value={config.cutOffRadius}
                onChange={(e) => setConfig({...config, cutOffRadius: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

           <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Force Strength</span>
                <span>{config.forceFactor.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.1" max="5.0" step="0.1" 
                value={config.forceFactor}
                onChange={(e) => setConfig({...config, forceFactor: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Time Scale</span>
                <span>{config.timeScale.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.1" max="2.0" step="0.1" 
                value={config.timeScale}
                onChange={(e) => setConfig({...config, timeScale: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

           <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Ripple Strength</span>
                <span>{config.rippleStrength?.toFixed(1) ?? "0.0"}</span>
              </div>
              <input 
                type="range" min="0.0" max="5.0" step="0.1" 
                value={config.rippleStrength ?? 0}
                onChange={(e) => setConfig({...config, rippleStrength: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
           </div>
        </div>

        {/* Atom Counts */}
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Particle Counts</h3>
            {config.colors.map((c, i) => (
              <div key={`count-${i}`} className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full" style={{backgroundColor: c}}></div>
                 <input 
                    type="range" min="0" max="1000" step="10"
                    value={config.atomCounts[i]}
                    onChange={(e) => {
                       const newCounts = [...config.atomCounts];
                       newCounts[i] = parseInt(e.target.value);
                       setConfig({...config, atomCounts: newCounts});
                    }}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                 />
                 <span className="text-sm text-slate-400 w-10 text-right">{config.atomCounts[i]}</span>
              </div>
            ))}
            <div className="text-xs text-slate-600 pt-2">
               Total: {config.atomCounts.reduce((a, b) => a + b, 0)} (Max ~2000 rec.)
            </div>
        </div>
      </div>
    </div>
  );
};