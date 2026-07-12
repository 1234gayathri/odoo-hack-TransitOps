import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { MaintenanceStatus, MaintenancePriority } from '@/lib/types';

function mapRecord(m: any) {
  return {
    id: m.id,
    vehicleId: m.vehicle_id,
    vehicleReg: m.vehicle_reg,
    type: m.type,
    description: m.description,
    status: m.status as MaintenanceStatus,
    priority: m.priority as MaintenancePriority,
    scheduledDate: m.scheduled_date,
    completedDate: m.completed_date,
    cost: parseInt(m.cost || 0),
    technician: m.technician,
    invoiceUrl: m.invoice_url || null,
    actualCost: m.actual_cost ? parseInt(m.actual_cost) : null,
    vendor: m.vendor || null,
    approvalStatus: m.approval_status || 'none',
    rejectionComments: m.rejection_comments || null,
  };
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM maintenance_records ORDER BY id ASC');
    return NextResponse.json({ success: true, records: res.rows.map(mapRecord) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicleId, type, description, status, priority, scheduledDate, cost, technician, invoiceUrl, actualCost, vendor, approvalStatus } = body;

    if (!vehicleId || !type || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required maintenance fields' }, { status: 400 });
    }

    // Retrieve vehicle registration
    const vRes = await query('SELECT registration FROM vehicles WHERE id = $1', [vehicleId]);
    if (vRes.rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    const vehicleReg = vRes.rows[0].registration;

    // Generate new record ID
    const maxIdRes = await query('SELECT id FROM maintenance_records');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('m', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 'm' + newIdNum;

    await query(
      `INSERT INTO maintenance_records (id, vehicle_id, vehicle_reg, type, description, status, priority, scheduled_date, completed_date, cost, technician, invoice_url, actual_cost, vendor, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        newId,
        vehicleId,
        vehicleReg,
        type.trim(),
        description ? description.trim() : '',
        status || 'scheduled',
        priority || 'medium',
        scheduledDate,
        status === 'completed' ? new Date().toISOString().split('T')[0] : null,
        parseInt(cost || 0),
        technician ? technician.trim() : 'Unassigned',
        invoiceUrl || null,
        actualCost ? parseInt(actualCost) : null,
        vendor || null,
        approvalStatus || 'none'
      ]
    );

    // If status is in_progress, change vehicle status to maintenance
    if (status === 'in_progress') {
      await query("UPDATE vehicles SET status = 'maintenance' WHERE id = $1", [vehicleId]);
    }

    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, vehicleId, type, description, status, priority, scheduledDate, cost, technician, invoiceUrl, actualCost, vendor, approvalStatus, rejectionComments } = body;

    if (!id) {
      return NextResponse.json({ error: 'Maintenance record ID is required' }, { status: 400 });
    }

    const currentRes = await query('SELECT * FROM maintenance_records WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    const cur = currentRes.rows[0];

    // Handle Workflow State Transitions
    let finalApprovalStatus = approvalStatus || cur.approval_status;
    let finalStatus = status || cur.status;
    let completedDate = cur.completed_date;

    // Handle Super Admin Approvals
    if (approvalStatus === 'approved' && cur.approval_status !== 'approved') {
      finalApprovalStatus = 'approved';
      finalStatus = 'completed';
      completedDate = new Date().toISOString().split('T')[0];

      // Auto create an approved expense
      const expenseId = 'exp_' + Date.now();
      const expenseCost = actualCost !== undefined ? parseInt(actualCost) : (cur.actual_cost || cur.cost || 0);
      const expenseVendor = vendor || cur.vendor || 'Maintenance Vendor';
      const expenseDesc = `Maintenance approved for ${cur.vehicle_reg}: ${type || cur.type} (Vendor: ${expenseVendor})`;

      await query(
        `INSERT INTO expenses (id, category, description, amount, date, vehicle_id, vehicle_reg, status, submitted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          expenseId,
          'Maintenance',
          expenseDesc,
          expenseCost,
          completedDate,
          cur.vehicle_id,
          cur.vehicle_reg,
          'approved',
          technician || cur.technician || 'System'
        ]
      );
    } else if (approvalStatus === 'rejected' && cur.approval_status !== 'rejected') {
      finalApprovalStatus = 'rejected';
      finalStatus = 'scheduled'; // Send back to maintenance manager
      completedDate = null;
    }

    let vehicleReg = cur.vehicle_reg;
    if (vehicleId && vehicleId !== cur.vehicle_id) {
      const vRes = await query('SELECT registration FROM vehicles WHERE id = $1', [vehicleId]);
      if (vRes.rows.length > 0) vehicleReg = vRes.rows[0].registration;
    }

    await query(
      `UPDATE maintenance_records
       SET vehicle_id = $1, vehicle_reg = $2, type = $3, description = $4, status = $5, priority = $6, scheduled_date = $7, completed_date = $8, cost = $9, technician = $10,
           invoice_url = $11, actual_cost = $12, vendor = $13, approval_status = $14, rejection_comments = $15
       WHERE id = $16`,
      [
        vehicleId || cur.vehicle_id,
        vehicleReg,
        type ? type.trim() : cur.type,
        description !== undefined ? description.trim() : cur.description,
        finalStatus,
        priority || cur.priority,
        scheduledDate || cur.scheduled_date,
        completedDate,
        cost !== undefined ? parseInt(cost) : cur.cost,
        technician ? technician.trim() : cur.technician,
        invoiceUrl !== undefined ? invoiceUrl : cur.invoice_url,
        actualCost !== undefined ? (actualCost ? parseInt(actualCost) : null) : cur.actual_cost,
        vendor !== undefined ? vendor : cur.vendor,
        finalApprovalStatus,
        rejectionComments !== undefined ? rejectionComments : cur.rejection_comments,
        id
      ]
    );

    // Update vehicle status accordingly
    const vid = vehicleId || cur.vehicle_id;
    if (finalStatus === 'completed') {
      await query("UPDATE vehicles SET status = 'available' WHERE id = $1", [vid]);
    } else if (finalStatus === 'in_progress') {
      await query("UPDATE vehicles SET status = 'maintenance' WHERE id = $1", [vid]);
    }

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
      return NextResponse.json({ error: 'Maintenance record ID is required' }, { status: 400 });
    }

    const mRes = await query('SELECT vehicle_id, status FROM maintenance_records WHERE id = $1', [id]);
    if (mRes.rows.length > 0) {
      const { vehicle_id, status } = mRes.rows[0];
      if (status === 'in_progress') {
        await query("UPDATE vehicles SET status = 'available' WHERE id = $1", [vehicle_id]);
      }
    }

    await query('DELETE FROM maintenance_records WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
