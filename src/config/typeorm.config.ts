import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/*
  THIS IS FOR DEVELOPMENT ENVIRONMENT
  for typeorm config cli
*/
export default new DataSource({
  type: 'postgres',
  host: '127.0.0.1', // 127.0.0.1 -> ipv4 of localhost and  only development environment docker compose host not support postgres
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'myapp',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
