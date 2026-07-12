import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM settings');
    const settingsObj: Record<string, string> = {};
    res.rows.forEach(r => {
      settingsObj[r.key] = r.value;
    });

    return NextResponse.json({ success: true, settings: settingsObj });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    // Insert or update each setting
    for (const [key, value] of Object.entries(settings)) {
      const check = await query('SELECT key FROM settings WHERE key = $1', [key]);
      if (check.rows.length > 0) {
        await query('UPDATE settings SET value = $1 WHERE key = $2', [String(value), key]);
      } else {
        await query('INSERT INTO settings (key, value) VALUES ($1, $2)', [key, String(value)]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
