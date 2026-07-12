import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapVehicle(v: any) {
  return {
    id: v.id,
    registration: v.registration,
    vin: v.vin,
    make: v.make,
    model: v.model,
    year: parseInt(v.year),
    capacity: parseInt(v.capacity),
    fuelType: v.fuel_type,
    status: v.status,
    odometer: parseInt(v.odometer),
    healthScore: parseInt(v.health_score),
    lastService: v.last_service,
    nextService: v.next_service,
    location: v.location,
  };
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM vehicles ORDER BY id ASC');
    return NextResponse.json({ success: true, vehicles: res.rows.map(mapVehicle) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { registration, vin, make, model, year, capacity, fuelType, status, odometer, healthScore, lastService, nextService, location } = body;

    if (!registration || !vin || !make || !model || !year || !capacity || !fuelType || !location) {
      return NextResponse.json({ error: 'Missing required vehicle fields' }, { status: 400 });
    }

    const regCheck = await query('SELECT id FROM vehicles WHERE registration = $1 OR vin = $2', [registration.trim(), vin.trim()]);
    if (regCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Vehicle with this registration or VIN already exists' }, { status: 400 });
    }

    const maxIdRes = await query('SELECT id FROM vehicles');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('v', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 'v' + newIdNum;

    await query(
      `INSERT INTO vehicles (id, registration, vin, make, model, year, capacity, fuel_type, status, odometer, health_score, last_service, next_service, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        newId,
        registration.trim(),
        vin.trim(),
        make.trim(),
        model.trim(),
        parseInt(year),
        parseInt(capacity),
        fuelType,
        status || 'available',
        parseInt(odometer || 0),
        parseInt(healthScore || 100),
        lastService || new Date().toISOString().split('T')[0],
        nextService || '-',
        location.trim()
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
    const { id, registration, vin, make, model, year, capacity, fuelType, status, odometer, healthScore, lastService, nextService, location } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    if (registration || vin) {
      const dupCheck = await query('SELECT id FROM vehicles WHERE (registration = $1 OR vin = $2) AND id != $3', [registration?.trim(), vin?.trim(), id]);
      if (dupCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Registration or VIN already taken by another vehicle' }, { status: 400 });
      }
    }

    const currentRes = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    const cur = currentRes.rows[0];

    await query(
      `UPDATE vehicles
       SET registration = $1, vin = $2, make = $3, model = $4, year = $5, capacity = $6, fuel_type = $7, status = $8, odometer = $9, health_score = $10, last_service = $11, next_service = $12, location = $13
       WHERE id = $14`,
      [
        registration ? registration.trim() : cur.registration,
        vin ? vin.trim() : cur.vin,
        make ? make.trim() : cur.make,
        model ? model.trim() : cur.model,
        year ? parseInt(year) : cur.year,
        capacity ? parseInt(capacity) : cur.capacity,
        fuelType || cur.fuel_type,
        status || cur.status,
        odometer !== undefined ? parseInt(odometer) : cur.odometer,
        healthScore !== undefined ? parseInt(healthScore) : cur.health_score,
        lastService || cur.last_service,
        nextService || cur.next_service,
        location ? location.trim() : cur.location,
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
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    await query('DELETE FROM vehicles WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
