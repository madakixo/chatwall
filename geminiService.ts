
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSweetNote = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, heartfelt romantic note for a partner based on this mood/context: "${prompt}". Keep it under 150 characters. Do not use quotes around the response.`,
      config: {
        systemInstruction: "You are a professional romantic writer. Your goal is to write sweet, authentic, and modern love notes for couples to share on their virtual wall.",
        temperature: 0.8,
      },
    });
    return response.text?.trim() || "You make my world brighter every single day. Love you!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Thinking of you always ❤️";
  }
};

export const getRelationshipAdvice = async (history: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given this interaction history: "${history}", provide a very brief, 1-sentence tip to keep the romance alive today.`,
        config: {
          systemInstruction: "You are a supportive relationship coach.",
          temperature: 0.7,
        },
      });
      return response.text?.trim() || "Try sending a spontaneous sweet text today!";
    } catch (error) {
        return "Little gestures often mean the most.";
    }
}

export const generateRomanticImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ text: `A dreamy, romantic illustration representing: ${prompt}. Soft warm colors, watercolor or artistic style, cozy atmosphere, focus on emotion and love.` }] 
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image part found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
