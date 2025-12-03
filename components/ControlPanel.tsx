import React, { useState } from 'react';
import { RefreshCw, ChevronRight, Settings2, Shuffle, MessageCircleQuestion, X, Loader2 } from 'lucide-react';
import { SimulationConfig } from '../types';
import { RuleMatrix } from './RuleMatrix';
import { explainSimulation } from '../services/geminiService';

interface ControlPanelProps {
  config: SimulationConfig;
  setConfig: (c: SimulationConfig) => void;
  onReset: () => void; // Resets positions but keeps rules
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  config, setConfig, onReset 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Explanation State
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleRandomizeSymmetric = () => {
    const newMatrix = config.interactionMatrix.map(row => [...row]);
    const size = newMatrix.length;
    
    for (let i = 0; i < size; i++) {
      for (let j = i; j < size; j++) {
        const val = Math.random() * 2 - 1;
        newMatrix[i][j] = val;
        newMatrix[j][i] = val;
      }
    }
    setConfig({ ...config, interactionMatrix: newMatrix });
  };

  const handleRandomizeAsymmetric = () => {
    const newMatrix = config.interactionMatrix.map(row => 
      row.map(() => Math.random() * 2 - 1)
    );
    setConfig({ ...config, interactionMatrix: newMatrix });
  };

  const togglePanel = () => setIsOpen(!isOpen);

  const handleExplain = async () => {
    // Check API Key
    // Use type assertion to access aistudio to avoid conflict with global types
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
      }
    }

    setIsExplaining(true);
    setExplanation(null); // Clear previous
    try {
      const text = await explainSimulation(config);
      setExplanation(text);
    } catch (e) {
      console.error(e);
      setExplanation("Could not generate explanation. Please check your network or API key.");
    } finally {
      setIsExplaining(false);
    }
  };

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
    <div className="fixed top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-sm border-l border-slate-800 text-slate-200 shadow-2xl overflow-y-auto z-50 transition-all custom-scrollbar">
        <div className="p-6 space-y-7 pb-20"> {/* pb-20 for extra scroll space */}
          
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
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <button 
                 onClick={handleRandomizeSymmetric}
                 className="py-3 bg-white text-black hover:bg-slate-200 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2"
                 title="Generate Symmetric Rules (Often creates cells/structures)"
              >
                <Shuffle size={18} /> Random Sym
              </button>
              <button 
                 onClick={handleRandomizeAsymmetric}
                 className="py-3 bg-slate-200 text-black hover:bg-white rounded text-sm font-bold transition-colors flex items-center justify-center gap-2"
                 title="Generate Asymmetric Rules (Often creates chaos/motion)"
              >
                <Shuffle size={18} /> Random Asym
              </button>
            </div>
            <button 
              onClick={onReset}
              className="w-16 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors flex items-center justify-center"
              title="Respawn Particles"
            >
              <RefreshCw size={24} />
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

          {/* Explain Button */}
          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={handleExplain}
              disabled={isExplaining}
              className="w-full py-3 bg-white text-black hover:bg-slate-200 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {isExplaining ? <Loader2 className="animate-spin" size={20} /> : <MessageCircleQuestion size={20} />}
              {isExplaining ? "Analyzing..." : "Explain to me"}
            </button>
            <p className="text-xs text-slate-600 text-center mt-2">
              Powered by Gemini 3
            </p>

            {/* Inline Explanation Panel */}
            {explanation && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                    <MessageCircleQuestion size={16} /> Analysis
                  </h4>
                  <button 
                    onClick={() => setExplanation(null)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-sm max-h-96 overflow-y-auto custom-scrollbar pr-2">
                   {explanation.split('\n').map((line, i) => (
                     <p key={i} className="mb-2 last:mb-0 leading-relaxed">
                       {line}
                     </p>
                   ))}
                </div>
              </div>
            )}
          </div>

        </div>
    </div>
  );
};