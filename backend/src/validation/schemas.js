// backend/src/validation/schemas.js
import { z } from 'zod';

export const createFarmSchema = z.object({
  name: z.string().min(2, "Farm name is required"),
  location: z.string().min(2, "Location is required"),
  soil_type: z.string().min(2, "Soil type is required"),
  size_acres: z.number().positive("Size must be greater than 0"),
  irrigation_system: z.string().min(2, "Irrigation system is required")
});

export const advisoryInputSchema = z.object({
  farm_id: z.string().uuid("Invalid farm ID"),
  crop_name: z.string().min(2, "Crop name is required"),
  growth_stage: z.string().min(2, "Growth stage is required"),
  symptom_description: z.string().min(10, "Please provide a detailed symptom description")
});
