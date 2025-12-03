import { GoogleGenAI, Type } from "@google/genai";
import { SimulationConfig } from "../types";

// Safety fallback - "Snake" pattern to be visually distinct
const FALLBACK_CONFIG: Partial<SimulationConfig> = {
  atomCounts: [200, 200, 200, 200, 200, 200],
  interactionMatrix: [
    [1.0, 0.5, 0.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.5, 0.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.5, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0, 0.5, 0.0],
    [0.0, 0.0, 0.0, 0.0, 1.0, 0.5],
    [0.5, 0.0, 0.0, 0.0, 0.0, 1.0],
  ],
  friction: 0.15,
  cutOffRadius: 120,
  forceFactor: 0.5,
  rippleStrength: 2.0,
};

export const generateRules = async (prompt: string): Promise<Partial<SimulationConfig>> => {
  let apiKey: string | undefined;
  
  try {
    // Safely attempt to access process.env.API_KEY
    // checks if process is defined to avoid ReferenceError in browser
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not access process.env.API_KEY:", e);
  }

  if (!apiKey) {
    console.warn("No API KEY found. Returning fallback configuration.");
    // Return fallback so the user sees a change even if API is missing
    return FALLBACK_CONFIG;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    You are an expert in emergence and particle physics simulations, specifically "Particle Life".
    Your goal is to generate interesting interaction rules (matrix) and parameters based on a user's description.
    
    The simulation has up to 6 types of particles (Color 0 to Color 5).
    The interaction matrix is 6x6. Values are between -1.0 (strong repulsion) and 1.0 (strong attraction).
    
    Return a JSON object matching the schema provided.
    Ensure 'atomCounts' has exactly 6 integers (use 0 for unused types).
    Ensure 'interactionMatrix' is a 6x6 array of numbers.
    'friction' should be 0.0 to 1.0 (typical good range 0.05 - 0.5).
    'cutOffRadius' typically 50 to 200.
    'forceFactor' typically 0.1 to 1.0.
    'rippleStrength' typically 1.0 to 5.0.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atomCounts: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "Array of 6 integers representing count of each particle type. Max total ~1500."
            },
            interactionMatrix: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
              },
              description: "6x6 matrix of interaction forces (-1.0 to 1.0)."
            },
            friction: { type: Type.NUMBER, description: "Friction coefficient (0.0 to 1.0)." },
            cutOffRadius: { type: Type.NUMBER, description: "Max interaction radius (pixels)." },
            forceFactor: { type: Type.NUMBER, description: "Strength of forces." },
            rippleStrength: { type: Type.NUMBER, description: "Strength of click ripple effect." },
          },
          required: ["atomCounts", "interactionMatrix", "friction", "cutOffRadius", "forceFactor"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    
    // Validate basics
    if (!json.interactionMatrix || json.interactionMatrix.length !== 6) {
       throw new Error("Invalid matrix generated");
    }

    // Ensure rippleStrength exists if model forgot it
    if (typeof json.rippleStrength !== 'number') {
      json.rippleStrength = 2.0;
    }

    return json;

  } catch (error) {
    console.error("Gemini Generation Error", error);
    // On error, return fallback to ensure app doesn't break, 
    // but the UI will likely want to know it failed. 
    // For now, we return fallback to keep the 'fun' going.
    return FALLBACK_CONFIG;
  }
};

export const explainSimulation = async (config: SimulationConfig): Promise<string> => {
  let apiKey: string | undefined;
  
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not access process.env.API_KEY:", e);
  }

  if (!apiKey) {
    throw new Error("API Key required for explanation");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze this Particle Life simulation configuration and explain the expected behavior.
    
    Configuration:
    - Atom Counts: ${config.atomCounts.join(', ')} (Colors: Red, Green, Blue, Yellow, Purple, Cyan)
    - Friction: ${config.friction.toFixed(2)} (0 is no friction, 1 is max)
    - Interaction Radius: ${config.cutOffRadius} pixels
    - Force Strength: ${config.forceFactor.toFixed(2)}
    - Interaction Matrix (Row acts on Column):
      ${config.interactionMatrix.map(row => JSON.stringify(row)).join('\n      ')}

    Please provide a concise but insightful explanation of:
    1. The dominant structures likely to emerge (e.g., gliders, cells, chains, chaos, expansion).
    2. How the specific global parameters (friction, force) influence the movement (e.g., damping vs energetic).
    3. Specific interesting interactions between color groups based on the matrix values.
    
    Keep the explanation under 200 words if possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a physicist analyzing a complex system. Keep the tone scientific but accessible. Use '###' for section headers, '**' for bold terms, and '-' for list items.",
      }
    });

    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Explanation Error", error);
    return "Failed to generate explanation. Please ensure you have selected a valid API Key.";
  }
};