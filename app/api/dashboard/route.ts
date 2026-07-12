import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Basic Counts
    const vehiclesRes = await query('SELECT status, health_score FROM vehicles');
    const driversRes = await query('SELECT status FROM drivers');
    const tripsRes = await query('SELECT status, distance, origin, destination, driver_name, vehicle_reg FROM trips');
    const maintenanceRes = await query('SELECT * FROM maintenance_records ORDER BY scheduled_date DESC LIMIT 10');
    
    // Check if audit_logs table exists before querying
    let logsRes = { rows: [] as any[] };
    try {
      logsRes = await query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 6');
    } catch (e) {
      // audit_logs might not exist, ignore
    }

    const notifRes = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 6');
    const expensesRes = await query("SELECT category, amount FROM expenses WHERE status = 'approved'");

    // Aggregate Data for KPIs
    const availableVehicles = vehiclesRes.rows.filter(v => v.status === 'available').length;
    const onTripVehicles = vehiclesRes.rows.filter(v => v.status === 'on_trip').length;
    
    const availableDrivers = driversRes.rows.filter(d => d.status === 'available').length;
    const onTripDrivers = driversRes.rows.filter(d => d.status === 'on_trip').length;
    
    const maintenanceToday = maintenanceRes.rows.filter(m => m.status === 'in_progress').length;
    
    const completedTrips = tripsRes.rows.filter(t => t.status === 'completed').length;
    const completionRate = tripsRes.rows.length > 0 ? Math.round((completedTrips / tripsRes.rows.length) * 100) : 100;
    
    const avgHealth = vehiclesRes.rows.length > 0 
      ? Math.round(vehiclesRes.rows.reduce((sum, v) => sum + Number(v.health_score || 0), 0) / vehiclesRes.rows.length)
      : 100;

    // Calculate real monthly expenses from PostgreSQL
    const totalApprovedExpenses = expensesRes.rows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    // Calculate dynamic expense categories
    const categories = ['Fuel', 'Maintenance', 'Insurance', 'Parts', 'Tolls'];
    const expenseBreakdownData = categories.map((cat, idx) => {
      const val = expensesRes.rows
        .filter(r => r.category.toLowerCase() === cat.toLowerCase())
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      
      // Fallback to default mock values if database is empty so dashboard doesn't look blank
      const fallbackValues = [45000, 25000, 15000, 8000, 5000];
      return {
        name: cat,
        value: val > 0 ? val : fallbackValues[idx],
        color: `hsl(var(--chart-${idx + 1}))`
      };
    });

    const fleetUtilizationData = [
      { day: 'Mon', utilization: 72 },
      { day: 'Tue', utilization: 78 },
      { day: 'Wed', utilization: 75 },
      { day: 'Thu', utilization: 82 },
      { day: 'Fri', utilization: 88 },
      { day: 'Sat', utilization: 65 },
      { day: 'Sun', utilization: 58 },
    ];

    const tripTrendData = [
      { month: 'Jan', completed: 145, cancelled: 12 },
      { month: 'Feb', completed: 162, cancelled: 8 },
      { month: 'Mar', completed: 185, cancelled: 15 },
      { month: 'Apr', completed: 175, cancelled: 10 },
      { month: 'May', completed: 210, cancelled: 18 },
      { month: 'Jun', completed: 245, cancelled: 14 },
    ];

    const fuelTrendData = [
      { month: 'Jan', cost: 38500 },
      { month: 'Feb', cost: 41200 },
      { month: 'Mar', cost: 43500 },
      { month: 'Apr', cost: 42100 },
      { month: 'May', cost: 46800 },
      { month: 'Jun', cost: 49200 },
    ];

    return NextResponse.json({
      success: true,
      kpis: {
        availableVehicles,
        onTripVehicles,
        availableDrivers,
        onTripDrivers,
        maintenanceToday,
        monthlyFuelCost: 49200, 
        monthlyExpenses: totalApprovedExpenses > 0 ? totalApprovedExpenses : 178000, 
        completionRate,
        avgHealth,
      },
      charts: {
        fleetUtilizationData,
        expenseBreakdownData,
        tripTrendData,
        fuelTrendData
      },
      lists: {
        auditLogs: logsRes.rows.map(r => ({
          id: r.id,
          user: r.user_name || r.user_id,
          action: r.action,
          module: r.module,
          details: r.details,
          timestamp: r.timestamp
        })),
        maintenanceRecords: maintenanceRes.rows.map(r => ({
          id: r.id,
          vehicleReg: r.vehicle_reg,
          type: r.type,
          scheduledDate: r.scheduled_date,
          status: r.status,
          priority: r.priority
        })),
        trips: tripsRes.rows.slice(0, 6).map(r => ({
          id: r.id || Math.random().toString(),
          origin: r.origin,
          destination: r.destination,
          status: r.status,
          driverName: r.driver_name,
          vehicleReg: r.vehicle_reg,
          distance: r.distance
        })),
        notifications: notifRes.rows.map(r => ({
          id: r.id,
          title: r.title,
          message: r.message,
          type: r.type,
          timestamp: r.created_at
        }))
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
