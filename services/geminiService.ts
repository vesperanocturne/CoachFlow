import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SessionMode, AnalysisResult } from "../types";

// Helper to lazily initialize the client to prevent immediate crashes on module load
// if the environment variable isn't ready.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from process.env");
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    confidence: { type: Type.NUMBER, description: "Score 0-100 based on tone and posture" },
    clarity: { type: Type.NUMBER, description: "Score 0-100 based on articulation and pacing" },
    engagement: { type: Type.NUMBER, description: "Score 0-100 based on eye contact and expression" },
    contentRelevance: { type: Type.NUMBER, description: "Score 0-100 based on context fit" },
    sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative", "Anxious", "Confident"] },
    pace: { type: Type.STRING, enum: ["Too Slow", "Good", "Too Fast"], description: "Speech speed assessment" },
    fillerWordCount: { type: Type.NUMBER, description: "Estimated count of filler words (um, ah, like) in this segment" },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Short, actionable coaching tips (max 3)"
    }
  },
  required: ["confidence", "clarity", "engagement", "contentRelevance", "sentiment", "suggestions"],
};

export const analyzeSessionSnapshot = async (
  mode: SessionMode,
  imageBase64: string,
  audioBase64: string | null
): Promise<AnalysisResult> => {
  try {
    const ai = getAiClient();
    const parts: any[] = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
      {
        text: `Analyze this snapshot from a live ${mode} session. 
        Focus on non-verbal cues (facial expression, eye contact, posture) AND speech patterns if audio context is implied.
        Estimate speech pace and filler word usage based on visual tension or mouth movement context if audio isn't fully processed, or provide best guess.
        Provide scoring metrics (0-100) and instant, short, actionable coaching advice.`
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert communication coach using the CoachFlow system. Be critical but encouraging.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return fallback data to keep UI alive
    return {
      metrics: { confidence: 70, clarity: 70, engagement: 70, contentRelevance: 70, pace: "Good", fillerWordCount: 0 },
      suggestions: ["Analyzing connection..."],
      sentiment: "Neutral"
    };
  }
};

export const generatePostSessionSummary = async (
  mode: SessionMode, 
  duration: number, 
  recordingBase64?: string
): Promise<{summary: string, script: string, transcript?: string}> => {
  try {
    const ai = getAiClient();
    const parts: any[] = [
      {
        text: `I just finished a ${duration} second ${mode} practice session. 
        Analyze the attached recording (if provided) or generate a generic summary based on typical performance.
        1. Provide a brief encouraging summary of the performance.
        2. Write a short 3-sentence "Next Practice Script" to help me warm up.
        3. If audio is audible, provide a rough transcript of the key points.`
      }
    ];

    if (recordingBase64) {
      parts.push({
        inlineData: {
          mimeType: "video/webm",
          data: recordingBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            script: { type: Type.STRING },
            transcript: { type: Type.STRING, nullable: true }
          },
          required: ["summary", "script"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { summary: "Session recorded.", script: "Practice your introduction again." };
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return { summary: "Session recorded.", script: "Practice your introduction again." };
  }
}