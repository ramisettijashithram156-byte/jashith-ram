// scripts/run_migrations.js
/**
 * Migration runner for Supabase using the Supabase CLI.
 * This script assumes the Supabase CLI is installed (`npm i -g supabase`).
 * It reads the `SUPABASE_PROJECT_ID` and `SUPABASE_SERVICE_ROLE_KEY` from
 * environment variables and executes `supabase db push` to apply the SQL
 * migrations located in the ./supabase/migrations directory.
 */

const { exec } = require('child_process');
require('dotenv').config({ path: '../backend/.env' });

const projectId = process.env.SUPABASE_PROJECT_ID;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!projectId || !serviceRoleKey) {
  console.error('Error: SUPABASE_PROJECT_ID and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

// Set environment variables expected by the Supabase CLI
process.env.SUPABASE_URL = `https://${projectId}.supabase.co`;
process.env.SUPABASE_ANON_KEY = serviceRoleKey; // CLI uses ANON_KEY for auth; we provide service role for full access.

console.log('Running Supabase migrations...');
exec('npx supabase db push', (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration failed: ${error.message}`);
    console.error(stderr);
    process.exit(1);
  }
  console.log('Migrations applied successfully.');
  console.log(stdout);
});
