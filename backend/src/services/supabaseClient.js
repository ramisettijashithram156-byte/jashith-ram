// backend/src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/index.js';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY);
