import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import {
  ShopPublicProfile,
  ShopStatus,
  PaperSize,
  ColorMode,
  PrintSide,
  PrinterStatus,
  UserRole,
} from '@/types';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async createShop(ownerId: string, dto: CreateShopDto) {
    const slug = dto.slug.toLowerCase().trim();
    const existing = await this.prisma.shop.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Shop with slug '${slug}' already exists`);
    }

    // Create shop with transaction: shop, default pricing rules, and default QR
    return this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: dto.name.trim(),
          slug,
          ownerId,
          address: dto.address?.trim(),
          phone: dto.phone?.trim(),
          email: dto.email?.trim(),
          upiId: dto.upiId?.trim(),
          status: ShopStatus.ACTIVE,
        },
      });

      // Initialize default pricing rules
      const defaultPricing = [
        { paperSize: PaperSize.A4, colorMode: ColorMode.BW, printSide: PrintSide.SINGLE, pricePerUnit: 1.0 },
        { paperSize: PaperSize.A4, colorMode: ColorMode.BW, printSide: PrintSide.DOUBLE, pricePerUnit: 1.5 },
        { paperSize: PaperSize.A4, colorMode: ColorMode.COLOR, printSide: PrintSide.SINGLE, pricePerUnit: 5.0 },
        { paperSize: PaperSize.A4, colorMode: ColorMode.COLOR, printSide: PrintSide.DOUBLE, pricePerUnit: 8.0 },
        { paperSize: PaperSize.A3, colorMode: ColorMode.BW, printSide: PrintSide.SINGLE, pricePerUnit: 3.0 },
        { paperSize: PaperSize.A3, colorMode: ColorMode.COLOR, printSide: PrintSide.SINGLE, pricePerUnit: 10.0 },
      ];

      for (const rule of defaultPricing) {
        await tx.pricingRule.create({
          data: {
            shopId: shop.id,
            paperSize: rule.paperSize as any,
            colorMode: rule.colorMode as any,
            printSide: rule.printSide as any,
            pricePerUnit: rule.pricePerUnit,
            minOrderFee: 0,
          },
        });
      }

      // Generate default QR Code
      const qrCode = `QR-${slug.toUpperCase()}-01`;
      await tx.shopQrCode.create({
        data: {
          shopId: shop.id,
          code: qrCode,
          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/shop/${shop.slug}`,
          isActive: true,
        },
      });

      return shop;
    });
  }

  async findBySlug(slug: string): Promise<ShopPublicProfile> {
    const cleanSlug = slug.toLowerCase().trim();
    const shop = await this.prisma.shop.findUnique({
      where: { slug: cleanSlug },
      include: {
        printers: {
          where: { status: { in: [PrinterStatus.READY, PrinterStatus.PRINTING] } },
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with handle '${slug}' was not found`);
    }

    if (shop.status === ShopStatus.SUSPENDED || shop.status === ShopStatus.INACTIVE) {
      throw new ForbiddenException(`This Xerox shop is currently ${shop.status.toLowerCase()}`);
    }

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      status: shop.status as any,
      logoUrl: shop.logoUrl,
      upiId: shop.upiId,
      hasActivePrinter: shop.printers.length > 0,
    };
  }

  async findById(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        pricingRules: true,
        printers: true,
        scanners: true,
        agents: { select: { id: true, name: true, status: true, lastHeartbeatAt: true } },
        qrCodes: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async updateShop(id: string, user: { id: string; role: UserRole }, dto: UpdateShopDto) {
    const shop = await this.findById(id);

    if (user.role !== UserRole.SUPER_ADMIN && shop.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this shop');
    }

    return this.prisma.shop.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as any,
      },
    });
  }

  async getPricing(shopId: string) {
    return this.prisma.pricingRule.findMany({
      where: { shopId, isActive: true },
    });
  }

  async getPrintersStatus(shopId: string) {
    return this.prisma.printer.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        driverName: true,
        connectionType: true,
        status: true,
        capabilities: true,
        isDefault: true,
        lastSeenAt: true,
      },
    });
  }

  async listAllShops() {
    return this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
