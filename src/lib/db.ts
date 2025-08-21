import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

// The schema for our manifests table, matching the final data structure.
const MANIFESTS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS manifests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        folio TEXT,
        fecha TEXT,
        aeropuertoSalida TEXT,
        tipoVuelo TEXT,
        transportistaCodigo TEXT,
        transportistaNombre TEXT,
        equipo TEXT,
        matricula TEXT,
        numeroVuelo TEXT,
        pilotoAlMando TEXT,
        licenciaPiloto TEXT,
        numeroTripulantes TEXT,
        origenVuelo TEXT,
        proximaEscala TEXT,
        destinoFinal TEXT,
        horaSlotAsignado TEXT,
        horaSlotCoordinado TEXT,
        horaTerminoPernocta TEXT,
        horaInicioManiobras TEXT,
        horaSalidaPosicion TEXT,
        demoras TEXT, -- Stored as JSON
        embarque TEXT, -- Stored as JSON
        totales TEXT, -- Stored as JSON
        observaciones TEXT,
        rawText TEXT
    );
`;

export async function getDb() {
    if (db) {
        return db;
    }

    // Open the database connection
    db = await open({
        filename: './sgm-aifa.db', // The database will be a single file
        driver: sqlite3.Database
    });

    // Run the schema migration
    await db.exec(MANIFESTS_SCHEMA);

    console.log('Database connection established and schema verified.');

    return db;
}
