
import { GoogleGenAI, Type } from "@google/genai";
import { Appointment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseScheduleImage = async (base64Image: string): Promise<Appointment[]> => {
  try {
    const model = "gemini-2.5-flash";
    
    // We remove the header data:image/png;base64, to get just the base64 string
    const base64Data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", 
              data: base64Data
            }
          },
          {
            text: "Analyze this schedule image. Extract all appointments. Group them by the section owner (e.g., Cindy, Leticia, Staff). Return a list of appointment objects. Separate phone numbers and email addresses."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              owner: { type: Type.STRING, description: "The person whose schedule this belongs to (e.g. Cindy, Leticia)" },
              time: { type: Type.STRING },
              clientName: { type: Type.STRING },
              description: { type: Type.STRING, description: "Details under the name, e.g., 'Nook windows'" },
              lastAcctSummary: { type: Type.STRING, nullable: true },
              phone: { type: Type.STRING, description: "Phone number only" },
              email: { type: Type.STRING, nullable: true, description: "Email address if present" },
              location: { type: Type.STRING },
              confirmation: { type: Type.STRING },
              dppsValue: { type: Type.STRING, nullable: true, description: "Value in 'Available for DPPs' column" },
              ifsValue: { type: Type.STRING, nullable: true, description: "Value in 'Available for IFs' column" }
            },
            required: ["owner", "time", "clientName", "description", "location"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    
    // Add IDs to the parsed data
    return data.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      rmdCheck: false // Default
    }));

  } catch (error) {
    console.error("Error parsing schedule image:", error);
    throw error;
  }
};
