import { pool } from './src/config/database';

async function clearDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    // El orden importa por las llaves foráneas, o usamos CASCADE
    await pool.query(`
      TRUNCATE TABLE 
        incidents, 
        contact_requests, 
        reviews, 
        notification_alerts, 
        products, 
        vendor_locations, 
        vendors, 
        users 
      CASCADE;
    `);
    
    console.log('✅ Base de datos limpiada exitosamente. Todos los registros han sido eliminados.');
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
  } finally {
    await pool.end();
  }
}

clearDatabase();
