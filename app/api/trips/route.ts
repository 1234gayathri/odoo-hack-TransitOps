import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { TripStatus } from '@/lib/types';

function mapTrip(t: any) {
  return {
    id: t.id,
    origin: t.origin,
    destination: t.destination,
    driverId: t.driver_id,
    driverName: t.driver_name,
    vehicleId: t.vehicle_id,
    vehicleReg: t.vehicle_reg,
    status: t.status as TripStatus,
    departureTime: t.departure_time,
    estimatedArrival: t.estimated_arrival,
    distance: parseInt(t.distance),
    cargoType: t.cargo_type,
    priority: t.priority as 'low' | 'normal' | 'high',
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const vehicleId = searchParams.get('vehicleId');

    let sql = 'SELECT * FROM trips';
    const params: any[] = [];

    if (driverId) {
      sql += ' WHERE driver_id = $1';
      params.push(driverId);
    } else if (vehicleId) {
      sql += ' WHERE vehicle_id = $1';
      params.push(vehicleId);
    }

    sql += ' ORDER BY id ASC';

    const res = await query(sql, params);
    return NextResponse.json({ success: true, trips: res.rows.map(mapTrip) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, driverId, vehicleId, status, departureTime, estimatedArrival, distance, cargoType, priority } = body;

    if (!origin || !destination || !driverId || !vehicleId || !departureTime || !estimatedArrival || !distance || !cargoType) {
      return NextResponse.json({ error: 'Missing required trip fields' }, { status: 400 });
    }

    // Load driver name
    const dRes = await query('SELECT name FROM drivers WHERE id = $1', [driverId]);
    if (dRes.rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    const driverName = dRes.rows[0].name;

    // Load vehicle registration
    const vRes = await query('SELECT registration FROM vehicles WHERE id = $1', [vehicleId]);
    if (vRes.rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    const vehicleReg = vRes.rows[0].registration;

    // Generate new trip ID
    const maxIdRes = await query('SELECT id FROM trips');
    const ids = maxIdRes.rows.map(r => parseInt(r.id.replace('t', '')) || 0);
    const newIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newId = 't' + newIdNum;

    await query(
      `INSERT INTO trips (id, origin, destination, driver_id, driver_name, vehicle_id, vehicle_reg, status, departure_time, estimated_arrival, distance, cargo_type, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        newId,
        origin.trim(),
        destination.trim(),
        driverId,
        driverName,
        vehicleId,
        vehicleReg,
        status || 'planned',
        departureTime,
        estimatedArrival,
        parseInt(distance),
        cargoType.trim(),
        priority || 'normal'
      ]
    );

    // Update driver and vehicle statuses if on trip
    if (status === 'in_transit' || status === 'dispatched') {
      await query("UPDATE drivers SET status = 'on_trip' WHERE id = $1", [driverId]);
      await query("UPDATE vehicles SET status = 'on_trip' WHERE id = $1", [vehicleId]);
    }

    return NextResponse.json({ success: true, tripId: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, origin, destination, driverId, vehicleId, status, departureTime, estimatedArrival, distance, cargoType, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const currentRes = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    const cur = currentRes.rows[0];

    let driverName = cur.driver_name;
    if (driverId && driverId !== cur.driver_id) {
      const dRes = await query('SELECT name FROM drivers WHERE id = $1', [driverId]);
      if (dRes.rows.length > 0) driverName = dRes.rows[0].name;
    }

    let vehicleReg = cur.vehicle_reg;
    if (vehicleId && vehicleId !== cur.vehicle_id) {
      const vRes = await query('SELECT registration FROM vehicles WHERE id = $1', [vehicleId]);
      if (vRes.rows.length > 0) vehicleReg = vRes.rows[0].registration;
    }

    await query(
      `UPDATE trips
       SET origin = $1, destination = $2, driver_id = $3, driver_name = $4, vehicle_id = $5, vehicle_reg = $6, status = $7, departure_time = $8, estimated_arrival = $9, distance = $10, cargo_type = $11, priority = $12
       WHERE id = $13`,
      [
        origin ? origin.trim() : cur.origin,
        destination ? destination.trim() : cur.destination,
        driverId || cur.driver_id,
        driverName,
        vehicleId || cur.vehicle_id,
        vehicleReg,
        status || cur.status,
        departureTime || cur.departure_time,
        estimatedArrival || cur.estimated_arrival,
        distance !== undefined ? parseInt(distance) : cur.distance,
        cargoType ? cargoType.trim() : cur.cargo_type,
        priority || cur.priority,
        id
      ]
    );

    // If trip status changes, update driver/vehicle availability statuses
    if (status && status !== cur.status) {
      const vid = vehicleId || cur.vehicle_id;
      const did = driverId || cur.driver_id;
      if (status === 'completed' || status === 'cancelled') {
        await query("UPDATE drivers SET status = 'available' WHERE id = $1", [did]);
        await query("UPDATE vehicles SET status = 'available' WHERE id = $1", [vid]);
      } else if (status === 'in_transit' || status === 'dispatched') {
        await query("UPDATE drivers SET status = 'on_trip' WHERE id = $1", [did]);
        await query("UPDATE vehicles SET status = 'on_trip' WHERE id = $1", [vid]);
      }
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
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Load trip to release driver/vehicle
    const tRes = await query('SELECT driver_id, vehicle_id FROM trips WHERE id = $1', [id]);
    if (tRes.rows.length > 0) {
      const { driver_id, vehicle_id } = tRes.rows[0];
      await query("UPDATE drivers SET status = 'available' WHERE id = $1", [driver_id]);
      await query("UPDATE vehicles SET status = 'available' WHERE id = $1", [vehicle_id]);
    }

    await query('DELETE FROM trips WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
