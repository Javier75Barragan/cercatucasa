const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'cercaya';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';

const databaseUrl = process.env.DATABASE_URL || `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

// Obtener el comando a ejecutar (up, down, create)
const args = process.argv.slice(2).join(' ');
const command = `node ./node_modules/node-pg-migrate/bin/node-pg-migrate ${args}`;

console.log(`Ejecutando migraciones...`);

try {
  execSync(command, {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  });
} catch (error) {
  console.error('Error ejecutando las migraciones.');
  process.exit(1);
}
