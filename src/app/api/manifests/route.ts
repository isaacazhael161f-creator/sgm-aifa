import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Handler to get all manifests
export async function GET() {
    try {
        const db = await getDb();
        const manifests = await db.all('SELECT * FROM manifests ORDER BY createdAt DESC');
        
        // Parse the JSON fields before sending to the client
        const parsedManifests = manifests.map(m => ({
            ...m,
            demoras: m.demoras ? JSON.parse(m.demoras) : [],
            embarque: m.embarque ? JSON.parse(m.embarque) : [],
            totales: m.totales ? JSON.parse(m.totales) : {},
        }));

        return NextResponse.json(parsedManifests);
    } catch (error) {
        console.error("Failed to fetch manifests:", error);
        return NextResponse.json({ error: 'Failed to fetch manifests' }, { status: 500 });
    }
}

// Handler to save a new manifest
export async function POST(request: Request) {
    try {
        const db = await getDb();
        const manifest = await request.json();

        // Prepare data for SQL insertion, stringifying JSON fields
        const params = {
            $folio: manifest.folio,
            $fecha: manifest.fecha,
            $aeropuertoSalida: manifest.aeropuertoSalida,
            $tipoVuelo: manifest.tipoVuelo,
            $transportistaCodigo: manifest.transportistaCodigo,
            $transportistaNombre: manifest.transportistaNombre,
            $equipo: manifest.equipo,
            $matricula: manifest.matricula,
            $numeroVuelo: manifest.numeroVuelo,
            $pilotoAlMando: manifest.pilotoAlMando,
            $licenciaPiloto: manifest.licenciaPiloto,
            $numeroTripulantes: manifest.numeroTripulantes,
            $origenVuelo: manifest.origenVuelo,
            $proximaEscala: manifest.proximaEscala,
            $destinoFinal: manifest.destinoFinal,
            $horaSlotAsignado: manifest.horaSlotAsignado,
            $horaSlotCoordinado: manifest.horaSlotCoordinado,
            $horaTerminoPernocta: manifest.horaTerminoPernocta,
            $horaInicioManiobras: manifest.horaInicioManiobras,
            $horaSalidaPosicion: manifest.horaSalidaPosicion,
            $demoras: manifest.demoras ? JSON.stringify(manifest.demoras) : null,
            $embarque: manifest.embarque ? JSON.stringify(manifest.embarque) : null,
            $totales: manifest.totales ? JSON.stringify(manifest.totales) : null,
            $observaciones: manifest.observaciones,
            $rawText: manifest.rawText
        };

        const result = await db.run(
            `INSERT INTO manifests (
                folio, fecha, aeropuertoSalida, tipoVuelo, transportistaCodigo, transportistaNombre, 
                equipo, matricula, numeroVuelo, pilotoAlMando, licenciaPiloto, numeroTripulantes, 
                origenVuelo, proximaEscala, destinoFinal, horaSlotAsignado, horaSlotCoordinado, 
                horaTerminoPernocta, horaInicioManiobras, horaSalidaPosicion, demoras, embarque, 
                totales, observaciones, rawText
            ) VALUES (
                $folio, $fecha, $aeropuertoSalida, $tipoVuelo, $transportistaCodigo, $transportistaNombre, 
                $equipo, $matricula, $numeroVuelo, $pilotoAlMando, $licenciaPiloto, $numeroTripulantes, 
                $origenVuelo, $proximaEscala, $destinoFinal, $horaSlotAsignado, $horaSlotCoordinado, 
                $horaTerminoPernocta, $horaInicioManiobras, $horaSalidaPosicion, $demoras, $embarque, 
                $totales, $observaciones, $rawText
            )`,
            params
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });

    } catch (error) {
        console.error("Failed to save manifest:", error);
        return NextResponse.json({ error: 'Failed to save manifest' }, { status: 500 });
    }
}
