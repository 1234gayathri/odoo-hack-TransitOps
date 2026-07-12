import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Attempt to alter the invoice_url column to TEXT
    await query('ALTER TABLE maintenance_records ALTER COLUMN invoice_url TYPE TEXT;');
    
    return NextResponse.json({ success: true, message: 'Database migrated successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
