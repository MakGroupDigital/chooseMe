
import { GoogleGenAI } from "@google/genai";

const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_GOOGLE_AI_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);

const getGeminiClient = () => {
  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

export const getTalentInsight = async (playerName: string, stats: any) => {
  const ai = getGeminiClient();
  if (!ai) {
    return "Analyse indisponible pour le moment.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this African football talent: ${playerName}. Stats: ${JSON.stringify(stats)}. Provide a short scouting report (max 100 words) focusing on potential and fit for European clubs.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analyse indisponible pour le moment.";
  }
};

export const getMatchPredictionInsight = async (match: any) => {
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this match: ${match.teamA} vs ${match.teamB}. Based on recent performance, give a quick win probability for Team A, Draw, and Team B. Format as simple percentages.`,
    });
    return response.text;
  } catch (error) {
    return null;
  }
};
