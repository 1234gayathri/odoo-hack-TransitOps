import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapReport(r: any) {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    generatedAt: r.generated_at,
    generatedBy: r.generated_by,
    filters: r.filters,
    rowCount: parseInt(r.row_count),
    filePath: r.file_path,
  };
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM reports ORDER BY generated_at DESC');
    return NextResponse.json({ success: true, reports: res.rows.map(mapReport) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    // Query active counts based on category type
    let rowCount = 0;
    if (type.toLowerCase() === 'vehicle') {
      const c = await query('SELECT COUNT(*) FROM vehicles');
      rowCount = parseInt(c.rows[0].count);
    } else if (type.toLowerCase() === 'driver') {
      const c = await query('SELECT COUNT(*) FROM drivers');
      rowCount = parseInt(c.rows[0].count);
    } else if (type.toLowerCase() === 'trip') {
      const c = await query('SELECT COUNT(*) FROM trips');
      rowCount = parseInt(c.rows[0].count);
    } else if (type.toLowerCase() === 'maintenance') {
      const c = await query('SELECT COUNT(*) FROM maintenance_records');
      rowCount = parseInt(c.rows[0].count);
    } else {
      const c = await query('SELECT COUNT(*) FROM users');
      rowCount = parseInt(c.rows[0].count);
    }

    // Generate new record ID
    const maxIdRes = await query('SELECT id FROM reports');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('rep', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 'rep' + newIdNum;

    await query(
      `INSERT INTO reports (id, title, type, generated_at, generated_by, filters, row_count, file_path)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)`,
      [
        newId,
        title.trim(),
        type,
        'Alexander Chen', // Super admin
        'Status: active/all',
        rowCount,
        `/exports/report_${newId}.csv`
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
