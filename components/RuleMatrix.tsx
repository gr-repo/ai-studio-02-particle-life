import React from 'react';
import { SimulationConfig } from '../types';

interface RuleMatrixProps {
  config: SimulationConfig;
  onChange: (newConfig: SimulationConfig) => void;
}

export const RuleMatrix: React.FC<RuleMatrixProps> = ({ config, onChange }) => {
  const handleCellChange = (row: number, col: number, val: number) => {
    const newMatrix = config.interactionMatrix.map(r => [...r]);
    newMatrix[row][col] = val;
    onChange({ ...config, interactionMatrix: newMatrix });
  };

  const getCellColor = (val: number) => {
    // Green for attraction (positive), Red for repulsion (negative)
    if (val > 0) return `rgba(34, 197, 94, ${Math.abs(val)})`;
    return `rgba(239, 68, 68, ${Math.abs(val)})`;
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-800 rounded-lg shadow-lg">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Interaction Rules</h3>
      <div className="grid grid-cols-7 gap-1">
        {/* Header Row */}
        <div className="col-span-1"></div>
        {config.colors.map((c, i) => (
          <div key={`head-${i}`} className="w-6 h-6 rounded-full mx-auto border border-slate-600" style={{ backgroundColor: c }}></div>
        ))}

        {/* Rows */}
        {config.colors.map((cRow, rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            {/* Row Label */}
            <div className="w-6 h-6 rounded-full mx-auto border border-slate-600 self-center" style={{ backgroundColor: cRow }}></div>
            
            {/* Cells */}
            {config.interactionMatrix[rowIdx].map((val, colIdx) => (
              <div 
                key={`${rowIdx}-${colIdx}`} 
                className="relative w-8 h-8 rounded border border-slate-700 overflow-hidden cursor-pointer group"
                style={{ backgroundColor: getCellColor(val) }}
                title={`Force from ${colIdx} on ${rowIdx}: ${val.toFixed(2)}`}
              >
                 {/* Invisible range input for editing */}
                 <input 
                  type="range" 
                  min="-1" 
                  max="1" 
                  step="0.1"
                  value={val}
                  onChange={(e) => handleCellChange(rowIdx, colIdx, parseFloat(e.target.value))}
                  className="opacity-0 w-full h-full cursor-pointer absolute inset-0 z-10"
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-mono text-white drop-shadow-md">
                    {val.toFixed(1)}
                 </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="text-[10px] text-slate-500 text-center mt-1">
        Row is attracted to/repelled by Column
      </div>
    </div>
  );
};
