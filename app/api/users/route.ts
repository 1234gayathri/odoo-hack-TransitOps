import { NextResponse } from 'next/server';
import { readDb, writeDb, User } from '@/lib/db';
import type { Role } from '@/lib/types';

// GET: Retrieve all users
export async function GET() {
  try {
    const db = readDb();
    return NextResponse.json({ success: true, users: db.users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add a new user
export async function POST(request: Request) {
  try {
    const { name, email, role, status } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    const db = readDb();

    // Check if user already exists
    if (db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate avatar initials (e.g. "Alexander Chen" -> "AC")
    const avatar = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newUser: User = {
      id: 'u' + (Math.max(...db.users.map(u => parseInt(u.id.replace('u', '')) || 0)) + 1),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as Role,
      avatar: avatar || 'U',
      status: (status || 'active') as 'active' | 'inactive',
      lastActive: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDb(db);

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Edit an existing user
export async function PUT(request: Request) {
  try {
    const { id, name, email, role, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if new email is taken by another user
    if (email && email.trim().toLowerCase() !== db.users[userIndex].email) {
      const emailExists = db.users.some(
        u => u.id !== id && u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 400 }
        );
      }
    }

    const currentUser = db.users[userIndex];
    
    // Update avatar if name changed
    let avatar = currentUser.avatar;
    if (name && name.trim() !== currentUser.name) {
      avatar = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }

    db.users[userIndex] = {
      ...currentUser,
      name: name ? name.trim() : currentUser.name,
      email: email ? email.trim().toLowerCase() : currentUser.email,
      role: role ? (role as Role) : currentUser.role,
      status: status ? (status as 'active' | 'inactive') : currentUser.status,
      avatar,
    };

    writeDb(db);

    return NextResponse.json({ success: true, user: db.users[userIndex] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove the user from the array
    db.users.splice(userIndex, 1);
    writeDb(db);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
