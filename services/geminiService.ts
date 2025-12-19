import { GoogleGenAI, Type } from "@google/genai";
import { Greeting } from "../types";

export const generateChristmasGreeting = async (recipient: string): Promise<Greeting> => {
  // Use the API key from environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `You are a creative Christmas elf. Generate a short, punchy, 2-line Christmas greeting based on the user's input. 
  The output must be VERY short (Max 7-8 characters per line) to fit on a particle display. 
  Use uppercase. 
  Return ONLY valid JSON.
  Example 1: Input "Mom" -> {"line1": "LOVE YOU", "line2": "MOM"}
  Example 2: Input "World" -> {"line1": "PEACE ON", "line2": "EARTH"}`;

  const userPrompt = `Generate a greeting for: ${recipient}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            line1: { type: Type.STRING },
            line2: { type: Type.STRING }
          },
          required: ['line1', 'line2']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Greeting;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback in case of error
    return { line1: "MERRY", line2: "CHRISTMAS" };
  }
};