
import { GoogleGenAI, Type } from "@google/genai";
import type { Product } from '../types';

export const getPurchaseSuggestion = async (product: Product, consumptionHistory: { date: Date; quantity: number }[]): Promise<string> => {
    try {
        if (!process.env.API_KEY) throw new Error("API_KEY missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Summarize context: Convert daily logs to weekly velocity to save tokens/reduce noise
        const weeklySummary: Record<string, number> = {};
        consumptionHistory.forEach(h => {
            const week = `W${Math.ceil(h.date.getDate() / 7)}`;
            weeklySummary[week] = (weeklySummary[week] || 0) + h.quantity;
        });

        const historyString = Object.entries(weeklySummary)
            .map(([week, qty]) => `${week}: ${qty} units`).join(', ');
        
        const prompt = `
            Analyze inventory for StockSense V6.
            Product: ${product.name} (Current: ${product.quantity} ${product.unit}, Threshold: ${product.reorderLevel})
            Weekly Consumption History: ${historyString || 'No recent usage.'}
            Requirement: Suggest replenishment quantity. Avoid overstocking.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // High velocity model for stats
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: { type: Type.NUMBER, description: "Recommended purchase quantity" },
                        justification: { type: Type.STRING, description: "Brief reasoning based on velocity" }
                    },
                    required: ["suggestion", "justification"]
                }
            }
        });

        return response.text || '{"suggestion":0, "justification": "AI failed to respond."}';
    } catch (error) {
        console.error("Gemini Error:", error);
        return JSON.stringify({ suggestion: 0, justification: "Error connecting to AI service." });
    }
};
