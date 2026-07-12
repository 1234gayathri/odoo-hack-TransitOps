import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { DriverStatus } from '@/lib/types';

function mapDriver(d: any) {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    licenseNumber: d.license_number,
    licenseExpiry: d.license_expiry,
    safetyScore: parseInt(d.safety_score),
    experienceYears: parseInt(d.experience_years),
    status: d.status as DriverStatus,
    verified: d.verified === true || d.verified === 'true',
    totalTrips: parseInt(d.total_trips),
    rating: parseFloat(d.rating),
    avatar: d.avatar,
  };
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM drivers ORDER BY id ASC');
    return NextResponse.json({ success: true, drivers: res.rows.map(mapDriver) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, licenseNumber, licenseExpiry, safetyScore, experienceYears, status, verified, totalTrips, rating } = body;

    if (!name || !email || !phone || !licenseNumber || !licenseExpiry) {
      return NextResponse.json({ error: 'Missing required driver fields' }, { status: 400 });
    }

    const emailCheck = await query('SELECT id FROM drivers WHERE email = $1 OR license_number = $2', [email.trim(), licenseNumber.trim()]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Driver with this email or license number already exists' }, { status: 400 });
    }

    const avatar = name
      .trim()
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const maxIdRes = await query('SELECT id FROM drivers');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('d', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 'd' + newIdNum;

    await query(
      `INSERT INTO drivers (id, name, email, phone, license_number, license_expiry, safety_score, experience_years, status, verified, total_trips, rating, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        newId,
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        licenseNumber.trim(),
        licenseExpiry,
        parseInt(safetyScore || 100),
        parseInt(experienceYears || 0),
        status || 'available',
        verified !== undefined ? !!verified : true,
        parseInt(totalTrips || 0),
        parseFloat(rating || 5.0),
        avatar || 'D'
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, licenseNumber, licenseExpiry, safetyScore, experienceYears, status, verified, totalTrips, rating } = body;

    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    if (email || licenseNumber) {
      const dupCheck = await query('SELECT id FROM drivers WHERE (email = $1 OR license_number = $2) AND id != $3', [email?.trim(), licenseNumber?.trim(), id]);
      if (dupCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Email or license number already taken by another driver' }, { status: 400 });
      }
    }

    const currentRes = await query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    const cur = currentRes.rows[0];

    const avatar = name
      ? name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
      : cur.avatar;

    await query(
      `UPDATE drivers
       SET name = $1, email = $2, phone = $3, license_number = $4, license_expiry = $5, safety_score = $6, experience_years = $7, status = $8, verified = $9, total_trips = $10, rating = $11, avatar = $12
       WHERE id = $13`,
      [
        name ? name.trim() : cur.name,
        email ? email.trim().toLowerCase() : cur.email,
        phone ? phone.trim() : cur.phone,
        licenseNumber ? licenseNumber.trim() : cur.license_number,
        licenseExpiry || cur.license_expiry,
        safetyScore !== undefined ? parseInt(safetyScore) : cur.safety_score,
        experienceYears !== undefined ? parseInt(experienceYears) : cur.experience_years,
        status || cur.status,
        verified !== undefined ? !!verified : cur.verified,
        totalTrips !== undefined ? parseInt(totalTrips) : cur.total_trips,
        rating !== undefined ? parseFloat(rating) : cur.rating,
        avatar,
        id
      ]
    );

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
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    await query('DELETE FROM drivers WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
