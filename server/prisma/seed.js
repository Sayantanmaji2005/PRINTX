"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting PrintX Database Seeding...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@printx.io' },
        update: {},
        create: {
            email: 'admin@printx.io',
            passwordHash,
            name: 'PrintX Super Admin',
            phone: '+919876543210',
            role: client_1.UserRole.SUPER_ADMIN,
        },
    });
    console.log('✅ Super Admin seeded:', superAdmin.email);
    const shopOwner = await prisma.user.upsert({
        where: { email: 'maji@printx.io' },
        update: {},
        create: {
            email: 'maji@printx.io',
            passwordHash,
            name: 'Subir Maji',
            phone: '+919830012345',
            role: client_1.UserRole.SHOP_OWNER,
        },
    });
    console.log('✅ Shop Owner seeded:', shopOwner.email);
    const shop = await prisma.shop.upsert({
        where: { slug: 'maji-xerox-station' },
        update: {},
        create: {
            name: 'Maji Xerox & Digital',
            slug: 'maji-xerox-station',
            ownerId: shopOwner.id,
            address: 'Shop 4, College Street Junction, Kolkata, West Bengal - 700073',
            phone: '+919830012345',
            email: 'contact@majixerox.in',
            upiId: 'majixerox@okaxis',
            status: client_1.ShopStatus.ACTIVE,
            retentionHours: 24,
        },
    });
    console.log('✅ Shop seeded:', shop.name, `(/shop/${shop.slug})`);
    await prisma.shopQrCode.upsert({
        where: { code: 'QR-MAJI-XEROX-01' },
        update: {},
        create: {
            shopId: shop.id,
            code: 'QR-MAJI-XEROX-01',
            qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/shop/${shop.slug}`,
            isActive: true,
        },
    });
    const pricingData = [
        { paperSize: client_1.PaperSize.A4, colorMode: client_1.ColorMode.BW, printSide: client_1.PrintSide.SINGLE, pricePerUnit: 1.0 },
        { paperSize: client_1.PaperSize.A4, colorMode: client_1.ColorMode.BW, printSide: client_1.PrintSide.DOUBLE, pricePerUnit: 1.5 },
        { paperSize: client_1.PaperSize.A4, colorMode: client_1.ColorMode.COLOR, printSide: client_1.PrintSide.SINGLE, pricePerUnit: 5.0 },
        { paperSize: client_1.PaperSize.A4, colorMode: client_1.ColorMode.COLOR, printSide: client_1.PrintSide.DOUBLE, pricePerUnit: 8.0 },
        { paperSize: client_1.PaperSize.A3, colorMode: client_1.ColorMode.BW, printSide: client_1.PrintSide.SINGLE, pricePerUnit: 3.0 },
        { paperSize: client_1.PaperSize.A3, colorMode: client_1.ColorMode.COLOR, printSide: client_1.PrintSide.SINGLE, pricePerUnit: 10.0 },
    ];
    for (const p of pricingData) {
        await prisma.pricingRule.upsert({
            where: {
                shopId_paperSize_colorMode_printSide: {
                    shopId: shop.id,
                    paperSize: p.paperSize,
                    colorMode: p.colorMode,
                    printSide: p.printSide,
                },
            },
            update: { pricePerUnit: p.pricePerUnit },
            create: {
                shopId: shop.id,
                paperSize: p.paperSize,
                colorMode: p.colorMode,
                printSide: p.printSide,
                pricePerUnit: p.pricePerUnit,
                minOrderFee: 0,
            },
        });
    }
    console.log('✅ Pricing rules seeded.');
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
                status: client_1.PrinterStatus.READY,
                capabilities: {
                    supportedSizes: ['A4', 'LETTER', 'LEGAL'],
                    duplex: true,
                    color: false,
                    maxDpi: 1200,
                },
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
//# sourceMappingURL=seed.js.map