
import { GoogleGenAI } from "@google/genai";
import type { Product } from '../types';

/* FIX: Removed global instance caching to ensure fresh initialization with current environment variables as per guidelines. */

export const getPurchaseSuggestion = async (product: Product): Promise<string> => {
    try {
        /* FIX: Initialize GoogleGenAI fresh right before the call as per guidelines. */
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
            You are an expert inventory management assistant for a system called StockSense.
            A product in our inventory is running low. Please provide a purchase suggestion.
            
            Product Details:
            - Name: ${product.name}
            - Current Quantity: ${product.quantity} ${product.unit}
            - Reorder Level: ${product.reorderLevel} ${product.unit}

            Based on this information, suggest a quantity to purchase and provide a brief, one-sentence justification for your suggestion.
            Format your response as a valid JSON object with two keys: "suggestion" (a number) and "justification" (a string). Do not include any other text or markdown formatting.

            Example Response:
            {
                "suggestion": 50,
                "justification": "Purchasing 50 units will replenish the stock to well above the reorder level, providing a healthy buffer for demand."
            }
        `;
        
        /* FIX: Using 'gemini-3-pro-preview' for complex reasoning task as per guidelines. */
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
             config: {
                responseMimeType: "application/json",
            }
        });

        /* FIX: Accessed .text property directly as it is not a method. */
        return response.text || "{}";
    } catch (error) {
        console.error("Error fetching purchase suggestion from Gemini API:", error);
        return JSON.stringify({
            error: "Could not get a suggestion at this time. Please check your API key and internet connection."
        });
    }
};
