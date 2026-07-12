import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Role, Permission, ModuleKey } from '@/lib/types';

// GET: Retrieve the permission matrix from PostgreSQL
export async function GET() {
  try {
    const res = await query('SELECT role, module, permission FROM permissions');
    
    // Format rows back into a matrix object
    const permissions: Record<string, Record<string, string>> = {};
    
    res.rows.forEach((row) => {
      if (!permissions[row.role]) {
        permissions[row.role] = {};
      }
      permissions[row.role][row.module] = row.permission;
    });

    return NextResponse.json({ success: true, permissions });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}

// POST: Update or insert a specific permission in PostgreSQL
export async function POST(request: Request) {
  try {
    const { role, module: moduleKey, permission } = await request.json();

    if (!role || !moduleKey || !permission) {
      return NextResponse.json(
        { error: 'Role, module, and permission are required' },
        { status: 400 }
      );
    }

    // Upsert permission
    await query(
      `INSERT INTO permissions (role, module, permission) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (role, module) 
       DO UPDATE SET permission = EXCLUDED.permission`,
      [role, moduleKey, permission]
    );

    // Retrieve updated matrix to return to client
    const matrixRes = await query('SELECT role, module, permission FROM permissions');
    const permissions: Record<string, Record<string, string>> = {};
    
    matrixRes.rows.forEach((row) => {
      if (!permissions[row.role]) {
        permissions[row.role] = {};
      }
      permissions[row.role][row.module] = row.permission;
    });

    return NextResponse.json({ success: true, permissions });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}
