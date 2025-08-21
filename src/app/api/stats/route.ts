import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDb();

        // 1. Get total number of manifests
        const totalManifestsResult = await db.get('SELECT COUNT(*) as count FROM manifests');
        const totalManifests = totalManifestsResult.count;

        // 2. Get flight counts per carrier
        const flightsPerCarrier = await db.all(
            'SELECT transportistaNombre, COUNT(*) as flightCount FROM manifests WHERE transportistaNombre IS NOT NULL GROUP BY transportistaNombre ORDER BY flightCount DESC'
        );

        // 3. Sum totals from the JSON 'totales' field
        const allManifests = await db.all('SELECT totales FROM manifests');
        let totalPassengers = 0;
        let totalCargo = 0;

        allManifests.forEach(m => {
            if (m.totales) {
                try {
                    const totals = JSON.parse(m.totales);
                    totalPassengers += parseInt(totals.pasajeros) || 0;
                    totalCargo += parseFloat(totals.cargaKg) || 0;
                } catch (e) {
                    console.error("Error parsing totals JSON:", e);
                }
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
