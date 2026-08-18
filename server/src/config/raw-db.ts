import pg from 'pg';
import 'dotenv/config';
const { Pool } = pg;
export const rawPool = new Pool({ connectionString: process.env.DATABASE_URL });
export async function closeRawPool(){ await rawPool.end(); }
