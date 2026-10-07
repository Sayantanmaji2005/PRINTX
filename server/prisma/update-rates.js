const { PrismaClient, PaperSize, ColorMode, PrintSide } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function run() {
  console.log('Connecting to database...');
  const shops = await prisma.shop.findMany({
    include: { pricingRules: true },
  });

  console.log(`Found ${shops.length} shops in database:`);

  const officialRates = [
    { paperSize: PaperSize.A4, colorMode: ColorMode.BW, printSide: PrintSide.SINGLE, pricePerUnit: 2.0 },
    { paperSize: PaperSize.A4, colorMode: ColorMode.BW, printSide: PrintSide.DOUBLE, pricePerUnit: 3.0 },
    { paperSize: PaperSize.A4, colorMode: ColorMode.COLOR, printSide: PrintSide.SINGLE, pricePerUnit: 6.0 },
    { paperSize: PaperSize.A4, colorMode: ColorMode.COLOR, printSide: PrintSide.DOUBLE, pricePerUnit: 10.0 },
    { paperSize: PaperSize.A3, colorMode: ColorMode.BW, printSide: PrintSide.SINGLE, pricePerUnit: 8.0 },
    { paperSize: PaperSize.A3, colorMode: ColorMode.BW, printSide: PrintSide.DOUBLE, pricePerUnit: 12.0 },
    { paperSize: PaperSize.A3, colorMode: ColorMode.COLOR, printSide: PrintSide.SINGLE, pricePerUnit: 20.0 },
    { paperSize: PaperSize.A3, colorMode: ColorMode.COLOR, printSide: PrintSide.DOUBLE, pricePerUnit: 30.0 },
  ];

  for (const shop of shops) {
    console.log(`\nUpdating pricing rules for shop: "${shop.name}" (${shop.slug})...`);
    console.log(`Existing rules count: ${shop.pricingRules.length}`);
    for (const r of shop.pricingRules) {
      console.log(`  - ${r.paperSize} ${r.colorMode} ${r.printSide}: ₹${r.pricePerUnit}`);
    }

    for (const rate of officialRates) {
      const existing = shop.pricingRules.find(
        (r) =>
          r.paperSize === rate.paperSize &&
          r.colorMode === rate.colorMode &&
          r.printSide === rate.printSide
      );

      if (existing) {
        await prisma.pricingRule.update({
          where: { id: existing.id },
          data: { pricePerUnit: rate.pricePerUnit, isActive: true },
        });
        console.log(`  ✅ Updated ${rate.paperSize} ${rate.colorMode} ${rate.printSide} -> ₹${rate.pricePerUnit}`);
      } else {
        await prisma.pricingRule.create({
          data: {
            shopId: shop.id,
            paperSize: rate.paperSize,
            colorMode: rate.colorMode,
            printSide: rate.printSide,
            pricePerUnit: rate.pricePerUnit,
            minOrderFee: 0,
            isActive: true,
          },
        });
        console.log(`  ➕ Created ${rate.paperSize} ${rate.colorMode} ${rate.printSide} -> ₹${rate.pricePerUnit}`);
      }
    }
  }

  console.log('\n🎉 All shop pricing rules updated in database successfully!');
}

run()
  .catch((e) => {
    console.error('Error updating pricing rules:', e);
  })
  .finally(() => prisma.$disconnect());
