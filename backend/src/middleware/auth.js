// backend/src/middleware/auth.js
import { supabase } from '../services/supabaseClient.js';

/**
 * Middleware to verify Supabase JWT token.
 * Expects Authorization: Bearer <token> header.
 * On success, attaches `req.user` with { id: userId }.
 */
export async function verifyAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header' });
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = { id: data.user.id };
    next();
  } catch (e) {
    console.error('Auth verification error:', e);
    res.status(500).json({ error: 'Server error during auth verification' });
  }
}
