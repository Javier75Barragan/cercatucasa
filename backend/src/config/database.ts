import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Soporte para Railway (DATABASE_URL) y desarrollo local (variables individuales)
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cercaya',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

export const pool = new Pool(poolConfig);

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Función helper para queries
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const initDB = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('🔄 Verificando conexión a la base de datos...');
    // Ejecutar una consulta simple para verificar la conexión
    await client.query('SELECT 1');
    console.log('✅ Conexión a la base de datos exitosa. Recuerda ejecutar `npm run migrate:up` si hay migraciones pendientes.');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
