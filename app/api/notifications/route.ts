import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapNotif(n: any) {
  return {
    id: n.id,
    fromRole: n.from_role,
    toRole: n.to_role,
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: n.created_at,
    read: n.read === true || n.read === 'true' || n.read === 1,
    maintenanceId: n.maintenance_id || null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let sql = 'SELECT * FROM notifications';
    const params: any[] = [];

    if (role && role !== 'super_admin') {
      sql += ' WHERE to_role = $1 OR to_role = $2';
      params.push(role, 'all');
    }

    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json({ success: true, notifications: res.rows.map(mapNotif) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, toRole, type, fromRole, maintenanceId } = body;

    if (!title || !message || !toRole) {
      return NextResponse.json({ error: 'Missing required notification fields' }, { status: 400 });
    }

    // Generate new record ID
    const maxIdRes = await query('SELECT id FROM notifications');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('n', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 'n' + newIdNum;

    await query(
      `INSERT INTO notifications (id, from_role, to_role, title, message, type, read, maintenance_id)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7)`,
      [
        newId,
        fromRole || 'system',
        toRole,
        title.trim(),
        message.trim(),
        type || 'info',
        maintenanceId || null,
      ]
    );

    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, read, markAllRead, role } = body;

    if (markAllRead) {
      if (role && role !== 'super_admin') {
        await query("UPDATE notifications SET read = true WHERE to_role = $1 OR to_role = $2", [role, 'all']);
      } else {
        await query("UPDATE notifications SET read = true");
      }
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await query('UPDATE notifications SET read = $1 WHERE id = $2', [!!read, id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await query('DELETE FROM notifications WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
