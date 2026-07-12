import { query } from '../lib/db';

async function checkSchema() {
  try {
    const res = await query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'maintenance_records';");
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
