import { NextResponse } from 'next/server';
import { DEFAULT_USERS } from '@/lib/users';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user by email (case-insensitive)
    const userEntry = Object.values(DEFAULT_USERS).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userEntry) {
      return NextResponse.json(
        { error: 'Invalid email address. Please use a demo email (e.g. alex.chen@transitops.io)' },
        { status: 401 }
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
      user: userEntry
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}
