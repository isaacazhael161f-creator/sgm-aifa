import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // 1. Get total number of manifests
        const totalManifestsResult = await db.query('SELECT COUNT(*) as count FROM manifests');
        const totalManifests = totalManifestsResult.rows[0].count;

        // 2. Get flight counts per carrier
        const flightsPerCarrierResult = await db.query(
            'SELECT transportistaNombre, COUNT(*) as flightCount FROM manifests WHERE transportistaNombre IS NOT NULL GROUP BY transportistaNombre ORDER BY flightCount DESC'
        );
        const flightsPerCarrier = flightsPerCarrierResult.rows;

        // 3. Sum totals from the JSON 'totales' field
        const allManifestsResult = await db.query('SELECT totales FROM manifests');
        const allManifests = allManifestsResult.rows;
        let totalPassengers = 0;
        let totalCargo = 0;

        allManifests.forEach(m => {
            if (m.totales) {
                // The 'totales' column is already parsed as JSON from the DB with pg
                const totals = m.totales;
                totalPassengers += parseInt(totals.pasajeros) || 0;
                totalCargo += parseFloat(totals.cargaKg) || 0;
            }
        });

        const stats = {
            totalManifests,
            flightsPerCarrier,
            totalPassengers,
            totalCargo,
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
