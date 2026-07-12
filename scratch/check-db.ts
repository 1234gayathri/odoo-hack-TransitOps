import { query } from '../lib/db';

async function check() {
  try {
    const res = await query("SELECT table_name, column_name FROM information_schema.columns WHERE character_maximum_length = 250");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
