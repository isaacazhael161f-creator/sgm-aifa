import { Pool } from 'pg';

// Create a connection pool. The connection string is read from the
// POSTGRES_URL environment variable that Vercel sets.
let pool: Pool;

function getPool() {
  if (!pool) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set.');
    }
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      // Vercel recommends these settings for serverless environments
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return pool;
}

// This function should be called once to initialize the database schema.
export async function initializeDb() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS manifests (
        id SERIAL PRIMARY KEY,
        folio TEXT UNIQUE,
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
        numeroTripulantes INTEGER,
        origenVuelo TEXT,
        proximaEscala TEXT,
        destinoFinal TEXT,
        horaSlotAsignado TEXT,
        horaSlotCoordinado TEXT,
        horaTerminoPernocta TEXT,
        horaInicioManiobras TEXT,
        horaSalidaPosicion TEXT,
        demoras JSONB,
        embarque JSONB,
        totales JSONB,
        observaciones TEXT,
        rawText TEXT,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database schema initialized successfully.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// We are exporting the pool directly to be used in the API routes.
export const db = getPool();