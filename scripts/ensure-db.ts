import { PrismaClient } from '@prisma/client';

async function main() {
  const fullUrl = process.env.DATABASE_URL || 'postgresql://postgres:PostgreSQL-Dev-Field-2026@localhost:5432/ibis_db?schema=public';
  
  // Extract base database connection pointing to 'postgres' system database
  const targetDbMatch = fullUrl.match(/\/([^/?]+)(\?|$)/);
  const targetDbName = targetDbMatch ? targetDbMatch[1] : 'ibis_db';
  
  // Create connection URL pointing to default 'postgres' database
  const postgresUrl = fullUrl.replace(`/${targetDbName}`, '/postgres');
  
  console.log(`🔍 Checking database server connection...`);
  const prismaPostgres = new PrismaClient({
    datasources: {
      db: {
        url: postgresUrl,
      },
    },
  });

  try {
    // Query existing databases
    const result: Array<{ datname: string }> = await prismaPostgres.$queryRaw`SELECT datname FROM pg_database WHERE datname = ${targetDbName}`;
    
    if (result.length === 0) {
      console.log(`📦 Database "${targetDbName}" does not exist. Creating database now...`);
      await prismaPostgres.$executeRawUnsafe(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully!`);
    } else {
      console.log(`✅ Database "${targetDbName}" already exists.`);
    }
  } catch (error: any) {
    console.warn(`⚠️ Warning during database verification: ${error.message || error}`);
    console.log(`Proceeding to schema synchronization...`);
  } finally {
    await prismaPostgres.$disconnect();
  }
}

main();
