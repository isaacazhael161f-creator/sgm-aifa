import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Handler to get all manifests
export async function GET() {
    try {
        // No need to call getDb() anymore, we use the exported pool
        const result = await db.query('SELECT * FROM manifests ORDER BY createdAt DESC');
        // The pg library returns rows in the `rows` property
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Failed to fetch manifests:", error);
        return NextResponse.json({ error: 'Failed to fetch manifests' }, { status: 500 });
    }
}

// Handler to save a new manifest
export async function POST(request: Request) {
    try {
        const manifest = await request.json();

        // Prepare data for SQL insertion
        const query = `
            INSERT INTO manifests (
                folio, fecha, aeropuertoSalida, tipoVuelo, transportistaCodigo, transportistaNombre, 
                equipo, matricula, numeroVuelo, pilotoAlMando, licenciaPiloto, numeroTripulantes, 
                origenVuelo, proximaEscala, destinoFinal, horaSlotAsignado, horaSlotCoordinado, 
                horaTerminoPernocta, horaInicioManiobras, horaSalidaPosicion, demoras, embarque, 
                totales, observaciones, rawText
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
            ) RETURNING id;
        `;

        const values = [
            manifest.folio,
            manifest.fecha,
            manifest.aeropuertoSalida,
            manifest.tipoVuelo,
            manifest.transportistaCodigo,
            manifest.transportistaNombre,
            manifest.equipo,
            manifest.matricula,
            manifest.numeroVuelo,
            manifest.pilotoAlMando,
            manifest.licenciaPiloto,
            manifest.numeroTripulantes,
            manifest.origenVuelo,
            manifest.proximaEscala,
            manifest.destinoFinal,
            manifest.horaSlotAsignado,
            manifest.horaSlotCoordinado,
            manifest.horaTerminoPernocta,
            manifest.horaInicioManiobras,
            manifest.horaSalidaPosicion,
            manifest.demoras ? JSON.stringify(manifest.demoras) : null,
            manifest.embarque ? JSON.stringify(manifest.embarque) : null,
            manifest.totales ? JSON.stringify(manifest.totales) : null,
            manifest.observaciones,
            manifest.rawText
        ];

        const result = await db.query(query, values);

        return NextResponse.json({ id: result.rows[0].id }, { status: 201 });

    } catch (error) {
        console.error("Failed to save manifest:", error);
        return NextResponse.json({ error: 'Failed to save manifest' }, { status: 500 });
    }
}
