export interface SimulationConfig {
  atomCounts: number[]; // Number of atoms per group
  colors: string[];     // Hex colors for each group
  interactionMatrix: number[][]; // N x N matrix of forces (-1 to 1)
  friction: number;     // 0 to 1
  timeScale: number;    // Simulation speed
  cutOffRadius: number; // Max interaction distance
  forceFactor: number;  // Multiplier for forces
  rippleStrength: number; // Strength of mouse interaction
}

export const DEFAULT_COLORS = [
  '#ef4444', // Red-500
  '#22c55e', // Green-500
  '#3b82f6', // Blue-500
  '#eab308', // Yellow-500
  '#a855f7', // Purple-500
  '#06b6d4', // Cyan-500
];

export const MIN_ATOMS = 100;
export const MAX_ATOMS = 3000;