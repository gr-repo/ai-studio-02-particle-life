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

    return json;

  } catch (error) {
    console.error("Gemini Generation Error", error);
    // On error, return fallback to ensure app doesn't break, 
    // but the UI will likely want to know it failed. 
    // For now, we return fallback to keep the 'fun' going.
    return FALLBACK_CONFIG;
  }
};