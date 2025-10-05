import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/*
  THIS IS FOR PRODUCTION ENVIRONMENT
  for typeorm config cli
*/
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'myapp',
  entities: ['dist/**/*.entity{.js,.ts}'],
  migrations: ['dist/migrations/*{.js,.ts}'],
  synchronize: false,
  logging: true,
});
