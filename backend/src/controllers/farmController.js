// backend/src/controllers/farmController.js
import { supabase } from '../services/supabaseClient.js';
import { createFarmSchema } from '../validation/schemas.js';

export const getFarms = async (req, res) => {
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createFarm = async (req, res) => {
  const parse = createFarmSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.errors });
  }
  const payload = { ...parse.data, user_id: req.user.id };
  const { data, error } = await supabase.from('farms').insert([payload]).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

export const updateFarm = async (req, res) => {
  const farmId = req.params.id;
  const parse = createFarmSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.errors });
  }
  const { data, error } = await supabase
    .from('farms')
    .update(parse.data)
    .eq('id', farmId)
    .eq('user_id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const deleteFarm = async (req, res) => {
  const farmId = req.params.id;
  const { error } = await supabase
    .from('farms')
    .delete()
    .eq('id', farmId)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};
