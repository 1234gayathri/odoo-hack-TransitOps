import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import type { Role, Permission, ModuleKey } from '@/lib/types';

// GET: Retrieve the permission matrix
export async function GET() {
  try {
    const db = readDb();
    return NextResponse.json({ success: true, permissions: db.permissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Update a specific permission
export async function POST(request: Request) {
  try {
    const { role, module: moduleKey, permission } = await request.json();

    if (!role || !moduleKey || !permission) {
      return NextResponse.json(
        { error: 'Role, module, and permission are required' },
        { status: 400 }
      );
    }

    const db = readDb();

    // Initialize role permissions object if not present
    if (!db.permissions[role as Role]) {
      db.permissions[role as Role] = {};
    }

    // Update the module permission
    db.permissions[role as Role][moduleKey as ModuleKey] = permission as Permission;

    writeDb(db);

    return NextResponse.json({ success: true, permissions: db.permissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
