// backend/src/services/geminiService.js
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config/index.js';

// Initialize Gemini SDK (server‑side only)
const genai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

// Define the expected schema for the AI response (same as spec)
export const cropAdvisorySchema = {
  type: "OBJECT",
  properties: {
    diagnosis_title: { type: "STRING" },
    confidence_score: { type: "NUMBER", description: "Value between 0 and 100" },
    severity_level: { type: "STRING", enum: ["Low", "Moderate", "High", "Critical"] },
    immediate_actions: { type: "ARRAY", items: { type: "STRING" } },
    treatment_plan: {
      type: "OBJECT",
      properties: {
        organic_options: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              treatment_name: { type: "STRING" },
              application_method: { type: "STRING" },
              dosage: { type: "STRING" }
            },
            required: ["treatment_name", "application_method", "dosage"]
          }
        },
        chemical_options: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              active_ingredient: { type: "STRING" },
              commercial_name_examples: { type: "STRING" },
              application_rate: { type: "STRING" },
              safety_precautions: { type: "STRING" }
            },
            required: ["active_ingredient", "application_rate", "safety_precautions"]
          }
        }
      },
      required: ["organic_options", "chemical_options"]
    },
    preventative_measures: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: [
    "diagnosis_title",
    "confidence_score",
    "severity_level",
    "immediate_actions",
    "treatment_plan",
    "preventative_measures"
  ]
};

/**
 * Analyze crop issue using Gemini multimodal model.
 * @param {Buffer} imageBuffer - Raw image data.
 * @param {string} mimeType - MIME type of the image.
 * @param {Object} context - Additional prompt context containing farm, crop, growth stage, and symptom description.
 * @returns {Promise<Object>} Parsed advisory JSON.
 */
export async function analyzeCropIssue({ imageBuffer, mimeType, context }) {
  // Prepare image part for Gemini
  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: mimeType
    }
  };

  // Build the text prompt from context
  const textPrompt = {
    role: 'user',
    parts: [
      {
        text: `You are an expert agronomist. Diagnose the crop issue based on the following details. Return ONLY the JSON matching the provided schema.

Crop: ${context.crop_name}\nGrowth Stage: ${context.growth_stage}\nSymptoms: ${context.symptom_description}\nFarm Location: ${context.farm_location}`
      }
    ]
  };

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [textPrompt, imagePart],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      // The schema is provided via responseSchema in the new SDK; using generationConfig.responseSchema if supported.
      responseSchema: cropAdvisorySchema
    }
  });

  // The SDK returns a response object; extract JSON text
  const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? response?.text;
  if (!jsonText) {
    throw new Error('Gemini did not return a JSON payload');
  }
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse Gemini JSON:', e, jsonText);
    throw new Error('Invalid JSON returned from Gemini');
  }
}
