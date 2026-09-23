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

  // 2. Shop Owner
  let shopOwner = await prisma.user.findUnique({
    where: { email: 'maji@printx.io' },
  });
  if (!shopOwner) {
    shopOwner = await prisma.user.create({
      data: {
        email: 'maji@printx.io',
        passwordHash,
        name: 'Subir Maji',
        phone: '+919830012345',
        role: UserRole.SHOP_OWNER,
      },
    });
  }
  console.log('✅ Shop Owner seeded:', shopOwner.email);

  // 3. Demo Shop: Maji Xerox & Digital
  let shop = await prisma.shop.findUnique({
    where: { slug: 'maji-xerox-station' },
  });
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: 'Maji Xerox & Digital',
        slug: 'maji-xerox-station',
        ownerId: shopOwner.id,
        address: 'Shop 4, College Street Junction, Kolkata, West Bengal - 700073',
        phone: '+919830012345',
        email: 'contact@majixerox.in',
        upiId: 'majixerox@okaxis',
        status: ShopStatus.ACTIVE,
        retentionHours: 24,
      },
    });
  }
  console.log('✅ Shop seeded:', shop.name, `(/shop/${shop.slug})`);

  // 4. Shop QR Code
  let qrCode = await prisma.shopQrCode.findUnique({
    where: { code: 'QR-MAJI-XEROX-01' },
  });
  if (!qrCode) {
    await prisma.shopQrCode.create({
      data: {
        shopId: shop.id,
        code: 'QR-MAJI-XEROX-01',
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/shop/${shop.slug}`,
        isActive: true,
      },
    });
  }

  // 5. Default Pricing Rules
  const pricingData = [
    { paperSize: PaperSize.A4, colorMode: ColorMode.BW, printSide: PrintSide.SINGLE, pricePerUnit: 1.0 },
    { paperSize: PaperSize.A4, colorMode: ColorMode.BW, printSide: PrintSide.DOUBLE, pricePerUnit: 1.5 },
    { paperSize: PaperSize.A4, colorMode: ColorMode.COLOR, printSide: PrintSide.SINGLE, pricePerUnit: 5.0 },
    { paperSize: PaperSize.A4, colorMode: ColorMode.COLOR, printSide: PrintSide.DOUBLE, pricePerUnit: 8.0 },
    { paperSize: PaperSize.A3, colorMode: ColorMode.BW, printSide: PrintSide.SINGLE, pricePerUnit: 3.0 },
    { paperSize: PaperSize.A3, colorMode: ColorMode.COLOR, printSide: PrintSide.SINGLE, pricePerUnit: 10.0 },
  ];

  for (const p of pricingData) {
    const existingRule = await prisma.pricingRule.findFirst({
      where: {
        shopId: shop.id,
        paperSize: p.paperSize,
        colorMode: p.colorMode,
        printSide: p.printSide,
      },
    });

    if (existingRule) {
      await prisma.pricingRule.update({
        where: { id: existingRule.id },
        data: { pricePerUnit: p.pricePerUnit },
      });
    } else {
      await prisma.pricingRule.create({
        data: {
          shopId: shop.id,
          paperSize: p.paperSize,
          colorMode: p.colorMode,
          printSide: p.printSide,
          pricePerUnit: p.pricePerUnit,
          minOrderFee: 0,
        },
      });
    }
  }
  console.log('✅ Pricing rules seeded.');

  // 6. Default Printer
  const existingPrinter = await prisma.printer.findFirst({
    where: { shopId: shop.id, name: 'HP LaserJet Pro M404dn' },
  });

  if (!existingPrinter) {
    await prisma.printer.create({
      data: {
        shopId: shop.id,
        name: 'HP LaserJet Pro M404dn',
        driverName: 'HP LaserJet Pro M404-M405 PCL-6',
        connectionType: 'USB',
        status: PrinterStatus.READY,
        capabilities: JSON.stringify({
          supportedSizes: ['A4', 'LETTER', 'LEGAL'],
          duplex: true,
          color: false,
          maxDpi: 1200,
        }),
        isDefault: true,
      },
    });
    console.log('✅ Default printer seeded.');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
