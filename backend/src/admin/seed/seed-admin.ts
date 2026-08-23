import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { AdminSeedType } from 'src/types/Admin.interface';


function loadAdminsFromEnv(): AdminSeedType[] {
  const admins: AdminSeedType[] = [];
  let index = 1;

  while (true) {
    const prefix = `ADMIN_${index}_`;
    const email = process.env[`${prefix}EMAIL`];
    const password = process.env[`${prefix}PASSWORD`];
    const username = process.env[`${prefix}USERNAME`];
    const language = process.env[`${prefix}LANGUAGE`];

    const hasAnyValue = email || password || username || language;
    if (!hasAnyValue) {
      break;
    }

    if (!email || !password) {
      console.warn( `⚠️  ADMIN_${index}_* Not a valid admin user`, );
      index++;
      continue;
    }

    admins.push({ index, username: username ?? `admin${index}`, email, password, language, });
    index++;
  }
  return admins;
}

async function main() {
  const admins = loadAdminsFromEnv();

  if (admins.length === 0) {
    console.log('No admin users found in environment variables. Skipping seeding.');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    for (const admin of admins) {
      const existing = await prisma.users.findUnique({ where: { Email: admin.email } });

      if (existing) {
        console.log(`Admin already exists (${admin.email}), skipping.`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      const created = await prisma.users.create( {
        data: {
          Username: admin.username,
          Email: admin.email,
          Password: hashedPassword,
          language: admin.language ?? 'en',
          role: Role.ADMIN,
        },
      });
      console.log(` ✅ Created admin #${created.id} (${created.Email}).`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed admin users:', error);
  process.exitCode = 1;
});