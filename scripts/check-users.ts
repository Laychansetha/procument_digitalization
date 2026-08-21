import { db } from '../src/lib/db';

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      assignedProvinces: true,
      status: true,
    },
    orderBy: { email: 'asc' },
  });
  console.log('Total Users:', users.length);
  users.forEach((u) => {
    console.log(`${u.name} | ${u.email} | ${u.role} | Assigned: ${u.assignedProvinces}`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
