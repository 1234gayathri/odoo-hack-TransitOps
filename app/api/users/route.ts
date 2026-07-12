import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Role } from '@/lib/types';

// Helper to map snake_case SQL users to camelCase JSON users
function mapUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    avatar: u.avatar,
    status: u.status as 'active' | 'inactive',
    lastActive: u.last_active ? new Date(u.last_active).toISOString() : new Date().toISOString(),
  };
}

// GET: Retrieve all users from PostgreSQL
export async function GET() {
  try {
    const res = await query('SELECT * FROM users ORDER BY id ASC');
    const users = res.rows.map(mapUser);
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}

// POST: Add a new user to PostgreSQL
export async function POST(request: Request) {
  try {
    const { name, email, role, status } = await request.json();

    // 1. Basic validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: 'Access role is required' }, { status: 400 });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email address format (e.g. name@company.com)' },
        { status: 400 }
      );
    }

    // 3. Unique email check
    const checkEmail = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (checkEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email address already exists' },
        { status: 400 }
      );
    }

    // 4. Generate initials for avatar
    const avatar = name
      .trim()
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    // 5. Generate new ID
    const maxIdRes = await query('SELECT id FROM users');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('u', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 'u' + newIdNum;

    const userStatus = status || 'active';
    const lastActive = new Date();

    // 6. Insert user
    await query(
      `INSERT INTO users (id, name, email, role, avatar, status, last_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [newId, name.trim(), email.trim().toLowerCase(), role, avatar || 'U', userStatus, lastActive]
    );

    const createdUser = {
      id: newId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as Role,
      avatar: avatar || 'U',
      status: userStatus as 'active' | 'inactive',
      lastActive: lastActive.toISOString(),
    };

    return NextResponse.json({ success: true, user: createdUser });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}

// PUT: Edit an existing user in PostgreSQL
export async function PUT(request: Request) {
  try {
    const { id, name, email, role, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch user to check existence
    const userCheck = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const currentUser = userCheck.rows[0];

    // 2. Validate email if it was changed
    if (email && email.trim().toLowerCase() !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Invalid email address format (e.g. name@company.com)' },
          { status: 400 }
        );
      }

      // Check uniqueness of the new email
      const emailDupCheck = await query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
        [email.trim(), id]
      );
      if (emailDupCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 400 }
        );
      }
    }

    // 3. Name check
    if (name && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // 4. Update avatar if name changed
    let avatar = currentUser.avatar;
    if (name && name.trim() !== currentUser.name) {
      avatar = name
        .trim()
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }

    const updatedName = name ? name.trim() : currentUser.name;
    const updatedEmail = email ? email.trim().toLowerCase() : currentUser.email;
    const updatedRole = role || currentUser.role;
    const updatedStatus = status || currentUser.status;

    // 5. Update user in DB
    await query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, status = $4, avatar = $5 
       WHERE id = $6`,
      [updatedName, updatedEmail, updatedRole, updatedStatus, avatar || 'U', id]
    );

    const updatedUser = {
      id,
      name: updatedName,
      email: updatedEmail,
      role: updatedRole as Role,
      avatar: avatar || 'U',
      status: updatedStatus as 'active' | 'inactive',
      lastActive: new Date(currentUser.last_active).toISOString(),
    };

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}

// DELETE: Permanently delete a user from PostgreSQL
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const res = await query('DELETE FROM users WHERE id = $1', [id]);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}
