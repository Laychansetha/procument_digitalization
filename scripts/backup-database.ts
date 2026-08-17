import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `ibis_db_backup_${timestamp}.sql`);

  console.log(`📦 Creating full PostgreSQL backup to: ${backupFile}...`);

  const pgDumpPath = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"`;
  const cmd = `${pgDumpPath} -h localhost -p 5432 -U postgres -d ibis_db -f "${backupFile}"`;

  execSync(cmd, {
    env: {
      ...process.env,
      PGPASSWORD: 'PostgreSQL-Dev-Field-2026',
    },
    stdio: 'inherit',
  });

  if (fs.existsSync(backupFile)) {
    const stats = fs.statSync(backupFile);
    console.log(`✅ Backup successfully created and verified!`);
    console.log(`   File: ${backupFile}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    throw new Error('Backup file was not created!');
  }
}

main().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
