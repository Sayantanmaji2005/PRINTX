import { PrismaClient, UserRole, ShopStatus, PaperSize, ColorMode, PrintSide, PrinterStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting PrintX Database Seeding...');

  // Hash default password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);

  // 1. Super Admin
  let superAdmin = await prisma.user.findUnique({
    where: { email: 'admin@printx.io' },
  });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'admin@printx.io',
        passwordHash,
        name: 'PrintX Super Admin',
        phone: '+919876543210',
        role: UserRole.SUPER_ADMIN,
      },
    });
  }
  console.log('✅ Super Admin seeded:', superAdmin.email);

  // 2. Production Ready Check
  const shopCount = await prisma.shop.count();
  console.log(`ℹ️ Current live shops in database: ${shopCount}`);

  console.log('🎉 Database seeding/admin verification completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
