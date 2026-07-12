import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Read users dynamically from JSON database
    const db = readDb();
    const userEntry = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userEntry) {
      return NextResponse.json(
        { error: 'Invalid email address. Please use a valid email (e.g. alex.chen@transitops.io)' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (userEntry.status === 'inactive') {
      return NextResponse.json(
        { error: 'This user account is deactivated.' },
        { status: 403 }
      );
    }

    // For the demo users, validate the default password
    if (password !== 'transitops2026') {
      return NextResponse.json(
        { error: 'Invalid password. Hint: Use transitops2026' },
        { status: 401 }
      );
    }

    // Success! Return the user data
    return NextResponse.json({
      success: true,
      user: {
        id: userEntry.id,
        name: userEntry.name,
        email: userEntry.email,
        role: userEntry.role,
        avatar: userEntry.avatar
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}
