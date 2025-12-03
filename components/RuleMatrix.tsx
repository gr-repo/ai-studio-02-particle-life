import React, { useState, useEffect } from 'react';
import { SimulationConfig } from '../types';

interface RuleMatrixProps {
  config: SimulationConfig;
  onChange: (newConfig: SimulationConfig) => void;
}

interface MatrixCellProps {
  row: number;
  col: number;
  value: number;
  onChange: (r: number, c: number, v: number) => void;
  color: string;
}

// Individual Cell Component to handle local editing state
const MatrixCell: React.FC<MatrixCellProps> = ({ 
  row, 
  col, 
  value, 
  onChange, 
  color 
}) => {
  const [text, setText] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Sync with prop changes when not being edited (e.g. AI generation or Randomize)
  useEffect(() => {
    if (!isFocused) {
      // Format nicely: max 2 decimals, remove trailing zeros
      setText(Number(value.toFixed(2)).toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Only update parent if it's a valid number
    // We allow typing "-" or empty string locally without updating parent
    const parsed = parseFloat(newText);
    if (!isNaN(parsed)) {
      onChange(row, col, parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Revert to valid value if current text is invalid (e.g. "-")
    // Or just clean up the formatting
    const parsed = parseFloat(text);
    if (isNaN(parsed)) {
      setText(Number(value.toFixed(2)).toString());
    } else {
      // Ensure we display the value that is actually in the state
      setText(Number(parsed.toFixed(2)).toString());
    }
  };

  return (
    <div 
      className="relative w-10 h-10 rounded border border-slate-700 overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <input 
        type="text" 
        inputMode="decimal"
        value={text}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={handleBlur}
        onChange={handleChange}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        className="w-full h-full bg-transparent text-center text-xs text-white font-mono focus:outline-none focus:bg-black/40 placeholder-transparent"
      />
    </div>
  );
};

export const RuleMatrix: React.FC<RuleMatrixProps> = ({ config, onChange }) => {
  const handleCellChange = (row: number, col: number, val: number) => {
    const newMatrix = config.interactionMatrix.map(r => [...r]);
    newMatrix[row][col] = val;
    onChange({ ...config, interactionMatrix: newMatrix });
  };

  const setAllZero = () => {
    const newMatrix = config.interactionMatrix.map(row => row.map(() => 0));
    onChange({ ...config, interactionMatrix: newMatrix });
  };

  const setIdentity = () => {
    const newMatrix = config.interactionMatrix.map((row, r) => 
      row.map((_, c) => (r === c ? 1 : 0))
    );
    onChange({ ...config, interactionMatrix: newMatrix });
  };

  const getCellColor = (val: number) => {
    // Clamp for visualization purposes
    const clamped = Math.max(-1, Math.min(1, val));
    // Green for attraction (positive), Red for repulsion (negative)
    if (clamped > 0) return `rgba(34, 197, 94, ${Math.abs(clamped)})`;
    return `rgba(239, 68, 68, ${Math.abs(clamped)})`;
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Interaction Rules</h3>
        <div className="flex gap-2">
          <button 
            onClick={setAllZero}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded border border-slate-600 transition-colors"
            title="Set all interactions to 0"
          >
            Zero
          </button>
          <button 
            onClick={setIdentity}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded border border-slate-600 transition-colors"
            title="Set diagonal to 1, others to 0"
          >
            Identity
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {/* Header Row */}
        <div className="col-span-1"></div>
        {config.colors.map((c, i) => (
          <div key={`head-${i}`} className="w-8 h-8 rounded-full mx-auto border border-slate-600" style={{ backgroundColor: c }}></div>
        ))}

        {/* Rows */}
        {config.colors.map((cRow, rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            {/* Row Label */}
            <div className="w-8 h-8 rounded-full mx-auto border border-slate-600 self-center" style={{ backgroundColor: cRow }}></div>
            
            {/* Cells */}
            {config.interactionMatrix[rowIdx].map((val, colIdx) => (
              <MatrixCell 
                key={`${rowIdx}-${colIdx}`}
                row={rowIdx}
                col={colIdx}
                value={val}
                onChange={handleCellChange}
                color={getCellColor(val)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="text-xs text-slate-500 text-center mt-2">
        Row is attracted to/repelled by Column
      </div>
    </div>
  );
};