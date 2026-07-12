import { query } from '../lib/db';

async function alterTable() {
  try {
    await query('ALTER TABLE maintenance_records ALTER COLUMN invoice_url TYPE TEXT;');
    console.log('Altered table successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

alterTable();
