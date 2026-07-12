import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM expenses ORDER BY date DESC');
    const expenses = res.rows.map(r => ({
      id: r.id,
      category: r.category,
      description: r.description,
      amount: parseFloat(r.amount),
      date: r.date,
      vehicleId: r.vehicle_id,
      vehicleReg: r.vehicle_reg,
      status: r.status,
      submittedBy: r.submitted_by
    }));
    return NextResponse.json({ success: true, expenses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, amount, date, vehicleId, vehicleReg, status, submittedBy } = body;

    const id = 'exp_' + Date.now();
    await query(
      `INSERT INTO expenses (id, category, description, amount, date, vehicle_id, vehicle_reg, status, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        category,
        description,
        parseFloat(amount),
        date || new Date().toISOString().split('T')[0],
        vehicleId || null,
        vehicleReg || null,
        status || 'pending',
        submittedBy || 'System'
      ]
    );
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }
    await query('UPDATE expenses SET status = $1 WHERE id = $2', [status, id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
