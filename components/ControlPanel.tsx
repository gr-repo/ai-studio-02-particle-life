import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Wand2, ChevronRight, Settings2, AlertCircle } from 'lucide-react';
import { SimulationConfig } from '../types';
import { RuleMatrix } from './RuleMatrix';
import { generateRules } from '../services/geminiService';

interface ControlPanelProps {
  config: SimulationConfig;
  setConfig: (c: SimulationConfig) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  onReset: () => void; // Resets positions but keeps rules
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  config, setConfig, isPlaying, setIsPlaying, onReset 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRandomize = () => {
    // Generate random symmetric-ish matrix
    const newMatrix = config.interactionMatrix.map(row => 
      row.map(() => Math.random() * 2 - 1)
    );
    setConfig({ ...config, interactionMatrix: newMatrix });
  };

  const handleAIGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const newRules = await generateRules(prompt);
      setConfig({ ...config, ...newRules });
      onReset(); // Respawn particles with new counts
    } catch (e) {
      console.error(e);
      setErrorMsg("Generation failed. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePanel = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <button 
        onClick={togglePanel}
        className="fixed top-4 right-4 z-50 p-2 bg-slate-800 text-slate-200 rounded-lg shadow-xl hover:bg-slate-700 transition-colors"
      >
        <Settings2 size={24} />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-800 text-slate-200 shadow-2xl overflow-y-auto z-50 transition-all">
      <div className="p-4 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Particle Life
          </h1>
          <button onClick={togglePanel} className="p-1 hover:bg-slate-800 rounded">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Playback */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
              isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play</>}
          </button>
          <button 
            onClick={onReset}
            className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
            title="Respawn Particles"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* AI Generator */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
           <div className="flex items-center gap-2 text-purple-400 mb-1">
             <Wand2 size={16} />
             <span className="text-xs font-bold uppercase tracking-wider">AI Director</span>
           </div>
           <textarea 
             className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500 resize-none h-20 placeholder:text-slate-600"
             placeholder="e.g., 'create a snake-like organism' or 'chaotic soup'"
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
           />
           
           {errorMsg && (
             <div className="flex items-center gap-2 text-red-400 text-xs px-1">
               <AlertCircle size={12} />
               <span>{errorMsg}</span>
             </div>
           )}

           <button 
             onClick={handleAIGenerate}
             disabled={isGenerating || !prompt}
             className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-semibold text-white transition-colors flex justify-center items-center gap-2"
           >
             {isGenerating ? (
               <>
                 <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                 Generating...
               </>
             ) : 'Generate Preset'}
           </button>
        </div>

        {/* Matrix Editor */}
        <RuleMatrix config={config} onChange={setConfig} />

        <div className="space-y-4">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Global Parameters</h3>
           
           {/* Sliders */}
           <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Friction</span>
                <span>{config.friction.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="0.9" step="0.01" 
                value={config.friction}
                onChange={(e) => setConfig({...config, friction: parseFloat(e.target.value)})}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

           <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Interaction Radius</span>
                <span>{config.cutOffRadius} px</span>
              </div>
              <input 
                type="range" min="10" max="200" step="1" 
                value={config.cutOffRadius}
                onChange={(e) => setConfig({...config, cutOffRadius: parseInt(e.target.value)})}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

           <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Force Strength</span>
                <span>{config.forceFactor.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.1" max="5.0" step="0.1" 
                value={config.forceFactor}
                onChange={(e) => setConfig({...config, forceFactor: parseFloat(e.target.value)})}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Time Scale</span>
                <span>{config.timeScale.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.1" max="2.0" step="0.1" 
                value={config.timeScale}
                onChange={(e) => setConfig({...config, timeScale: parseFloat(e.target.value)})}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>
        </div>

        {/* Atom Counts */}
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Particle Counts</h3>
            {config.colors.map((c, i) => (
              <div key={`count-${i}`} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: c}}></div>
                 <input 
                    type="range" min="0" max="1000" step="10"
                    value={config.atomCounts[i]}
                    onChange={(e) => {
                       const newCounts = [...config.atomCounts];
                       newCounts[i] = parseInt(e.target.value);
                       setConfig({...config, atomCounts: newCounts});
                    }}
                    className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                 />
                 <span className="text-xs text-slate-400 w-8 text-right">{config.atomCounts[i]}</span>
              </div>
            ))}
            <div className="text-[10px] text-slate-600 pt-2">
               Total: {config.atomCounts.reduce((a, b) => a + b, 0)} (Max ~2000 rec.)
            </div>
        </div>

        <button 
           onClick={handleRandomize}
           className="w-full py-2 mt-4 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-sm transition-colors"
        >
          Randomize Rules
        </button>

      </div>
    </div>
  );
};