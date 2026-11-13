// backend/src/controllers/advisoryController.js
import { supabase } from '../services/supabaseClient.js';
import { advisoryInputSchema } from '../validation/schemas.js';
import { analyzeCropIssue } from '../services/geminiService.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure multer to store files in memory (no disk write)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Helper to fetch farm location (or any needed data)
async function getFarmDetails(farmId, userId) {
  const { data, error } = await supabase
    .from('farms')
    .select('location')
    .eq('id', farmId)
    .eq('user_id', userId)
    .single();
  if (error) throw new Error('Farm not found or access denied');
  return data;
}

/**
 * GET /api/advisories – list all advisories for authenticated user
 */
export const listAdvisories = async (req, res) => {
  const { data, error } = await supabase
    .from('advisories')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

/**
 * GET /api/advisories/:id – retrieve a single advisory
 */
export const getAdvisory = async (req, res) => {
  const advisoryId = req.params.id;
  const { data, error } = await supabase
    .from('advisories')
    .select('*')
    .eq('id', advisoryId)
    .eq('user_id', req.user.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

/**
 * POST /api/advisories – create a new advisory
 * Expects multipart/form-data with fields:
 *   - image (optional image file)
 *   - farm_id, crop_name, growth_stage, symptom_description
 */
export const createAdvisory = [
  upload.single('image'),
  async (req, res) => {
    // Validate textual fields
    const parse = advisoryInputSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors });
    }
    const { farm_id, crop_name, growth_stage, symptom_description } = parse.data;

    // Fetch farm details for contextual info (e.g., location)
    let farmLocation = '';
    try {
      const farm = await getFarmDetails(farm_id, req.user.id);
      farmLocation = farm.location;
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // Handle image upload (optional)
    let imageUrl = null;
    if (req.file) {
      const fileExt = req.file.mimetype.split('/')[1];
      const fileName = `${uuidv4()}.${fileExt}`;
      const { error: uploadErr } = await supabase
        .storage
        .from('advisory-images')
        .upload(fileName, req.file.buffer, { upsert: false, contentType: req.file.mimetype });
      if (uploadErr) {
        console.error('Supabase storage upload error:', uploadErr);
        return res.status(500).json({ error: 'Failed to store image' });
      }
      // Build public URL (assuming public bucket)
      const { data: publicData } = supabase.storage.from('advisory-images').getPublicUrl(fileName);
      imageUrl = publicData?.publicUrl || null;
    }

    // Call Gemini service
    let advisoryResult;
    try {
      advisoryResult = await analyzeCropIssue({
        imageBuffer: req.file?.buffer,
        mimeType: req.file?.mimetype,
        context: {
          crop_name,
          growth_stage,
          symptom_description,
          farm_location: farmLocation
        }
      });
    } catch (e) {
      console.error('Gemini service error:', e);
      return res.status(500).json({ error: 'AI analysis failed', details: e.message });
    }

    // Build advisory payload for DB insertion
    const payload = {
      user_id: req.user.id,
      farm_id,
      crop_name,
      growth_stage,
      symptom_description,
      image_url: imageUrl,
      diagnosis_title: advisoryResult.diagnosis_title,
      confidence_score: advisoryResult.confidence_score,
      severity_level: advisoryResult.severity_level,
      immediate_actions: advisoryResult.immediate_actions,
      treatment_plan: advisoryResult.treatment_plan,
      preventative_measures: advisoryResult.preventative_measures
    };

    const { data, error } = await supabase.from('advisories').insert([payload]).single();
    if (error) {
      console.error('DB insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  }
];
