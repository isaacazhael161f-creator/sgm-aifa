import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Function to convert JSON data to a CSV string
function convertToCsv(data: any[]) {
    if (data.length === 0) {
        return "";
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // Header row
    ];

    for (const row of data) {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) {
                value = ''
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            // Escape quotes and wrap in quotes if value contains comma or quote
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"')) {
                value = `"${stringValue.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export async function GET() {
    try {
        const db = await getDb();
        // Fetch all data. In a real-world large-scale app, you'd want pagination.
        const manifests = await db.all('SELECT * FROM manifests ORDER BY createdAt DESC');

        const csv = convertToCsv(manifests);

        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', 'attachment; filename="manifiestos.csv"');

        return new NextResponse(csv, { status: 200, headers });

    } catch (error) {
        console.error("Failed to export manifests:", error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}