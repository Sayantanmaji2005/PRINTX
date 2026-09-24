import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ShopStatus,
  PrinterStatus,
  PaymentStatus,
  UserRole,
  PaperSize,
  ColorMode,
  PrintSide,
} from '@/types';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  private cache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 2500; // 2.5s fast cache

  constructor(private prisma: PrismaService) {}

  clearCache() {
    this.cache = null;
  }

  async getPlatformOverview(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.cache.timestamp < this.CACHE_TTL_MS) {
      return this.cache.data;
    }

    const [
      totalShops,
      activeShops,
      totalCustomerSessions,
      totalOrders,
      revenueAggregation,
      activePrinters,
      recentShops,
    ] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.shop.count({ where: { status: ShopStatus.ACTIVE } }),
      this.prisma.customerSession.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.SUCCESS },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.printer.count({
        where: { status: { in: [PrinterStatus.READY, PrinterStatus.PRINTING] } },
      }),
      this.prisma.shop.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          upiId: true,
          status: true,
          createdAt: true,
          owner: { select: { name: true, email: true, phone: true } },
          printers: { select: { id: true, name: true, status: true } },
          qrCodes: { where: { isActive: true }, take: 1, select: { code: true, qrImageUrl: true } },
          _count: { select: { orders: true, customerSessions: true } },
        },
      }),
    ]);

    const totalRevenue = revenueAggregation._sum.total || 0;
    const paidOrders = revenueAggregation._count.id || 0;

    const result = {
      metrics: {
        totalShops,
        activeShops,
        totalCustomerSessions,
        totalOrders,
        paidOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPagesPrinted: paidOrders,
        activePrinters,
      },
      recentShops: recentShops.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        address: s.address,
        upiId: s.upiId,
        ownerName: s.owner?.name || 'Owner',
        ownerEmail: s.owner?.email,
        ownerPhone: s.owner?.phone,
        status: s.status,
        qrCode: s.qrCodes[0]?.code,
        qrImageUrl: s.qrCodes[0]?.qrImageUrl,
        printersCount: s.printers.length,
        hasOnlinePrinter: s.printers.some(
          (p) => p.status === PrinterStatus.READY || p.status === PrinterStatus.PRINTING,
        ),
        totalOrders: s._count.orders,
        totalCustomers: s._count.customerSessions,
        createdAt: s.createdAt,
      })),
    };

    this.cache = { data: result, timestamp: now };
    return result;
  }

  async getAllShops() {
    return this.prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        printers: true,
        qrCodes: true,
        _count: { select: { orders: true, customerSessions: true } },
      },
    });
  }

  async createShopWithQr(dto: {
    name: string;
    slug?: string;
    ownerName: string;
    ownerEmail?: string;
    ownerPhone?: string;
    address?: string;
    upiId?: string;
    retentionHours?: number;
  }) {
    // 1. Generate or sanitize slug
    const baseSlug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    const existing = await this.prisma.shop.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 2. Find or create Shop Owner User
    const ownerEmail =
      dto.ownerEmail?.toLowerCase().trim() ||
      `${slug}@printx-station.local`;

    let owner = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (!owner) {
      const salt = await bcrypt.genSalt(10);
      const defaultHash = await bcrypt.hash('Shop@123', salt);
      owner = await this.prisma.user.create({
        data: {
          name: dto.ownerName.trim(),
          email: ownerEmail,
          phone: dto.ownerPhone?.trim(),
          passwordHash: defaultHash,
          role: UserRole.SHOP_OWNER,
        },
      });
    }

    // 3. Create Shop, Pricing Rules, QR Standee, and Default Printer in transaction
    const createdShop = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: dto.name.trim(),
          slug,
          ownerId: owner.id,
          address: dto.address?.trim(),
          phone: dto.ownerPhone?.trim(),
          email: ownerEmail,
          upiId: dto.upiId?.trim() || `${slug}@okaxis`,
          status: ShopStatus.ACTIVE,
          retentionHours: dto.retentionHours || 24,
        },
      });

      // Encrypted QR token
      const qrToken = `QR-PX-${slug.toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const customerUrl = `http://localhost:3000/shop/${shop.slug}`;

      await tx.shopQrCode.create({
        data: {
          shopId: shop.id,
          code: qrToken,
          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(customerUrl)}`,
          isActive: true,
        },
      });

      // Default Standard Pricing
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

      // Default Printer
      await tx.printer.create({
        data: {
          shopId: shop.id,
          name: 'Standard Laser Printer',
          connectionType: 'USB',
          status: PrinterStatus.READY,
          capabilities: JSON.stringify({
            supportedSizes: ['A4', 'LETTER'],
            duplex: true,
            color: false,
          }),
          isDefault: true,
        },
      });

      const result = await tx.printer.findFirst({ where: { shopId: shop.id } });
      return shop;
    });
    this.clearCache();
    return createdShop;
  }

  async updateShopStatus(shopId: string, status: ShopStatus) {
    this.clearCache();
    return this.prisma.shop.update({
      where: { id: shopId },
      data: { status: status as any },
    });
  }

  async deleteShopPermanently(shopId: string) {
    this.clearCache();
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new ConflictException(`Shop with ID ${shopId} not found`);
    }

    // 1. Get all orders for this shop
    const orders = await this.prisma.order.findMany({
      where: { shopId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await this.prisma.printJob.deleteMany({ where: { orderId: { in: orderIds } } });
      await this.prisma.printConfiguration.deleteMany({ where: { orderId: { in: orderIds } } });
      await this.prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await this.prisma.refund.deleteMany({ where: { orderId: { in: orderIds } } });
      await this.prisma.invoice.deleteMany({ where: { orderId: { in: orderIds } } });

      const payments = await this.prisma.payment.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true },
      });
      const paymentIds = payments.map((p) => p.id);
      if (paymentIds.length > 0) {
        await this.prisma.paymentEvent.deleteMany({ where: { paymentId: { in: paymentIds } } });
        await this.prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
      }

      await this.prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    // 2. Get customer sessions and documents
    const customerSessions = await this.prisma.customerSession.findMany({
      where: { shopId },
      select: { id: true },
    });
    const sessionIds = customerSessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      const documents = await this.prisma.document.findMany({
        where: { customerSessionId: { in: sessionIds } },
        select: { id: true },
      });
      const docIds = documents.map((d) => d.id);
      if (docIds.length > 0) {
        await this.prisma.documentPage.deleteMany({ where: { documentId: { in: docIds } } });
        await this.prisma.document.deleteMany({ where: { id: { in: docIds } } });
      }
      await this.prisma.customerSession.deleteMany({ where: { id: { in: sessionIds } } });
    }

    // 3. Delete Print Agents & Heartbeats
    const agents = await this.prisma.printAgent.findMany({
      where: { shopId },
      select: { id: true },
    });
    const agentIds = agents.map((a) => a.id);
    if (agentIds.length > 0) {
      await this.prisma.printAgentHeartbeat.deleteMany({ where: { agentId: { in: agentIds } } });
      await this.prisma.printAgent.deleteMany({ where: { id: { in: agentIds } } });
    }

    // 4. Delete Hardware Printers & Scanners
    await this.prisma.printer.deleteMany({ where: { shopId } });
    await this.prisma.scanner.deleteMany({ where: { shopId } });

    // 5. Delete Pricing Rules
    await this.prisma.pricingRule.deleteMany({ where: { shopId } });

    // 6. Delete QR Codes
    await this.prisma.shopQrCode.deleteMany({ where: { shopId } });

    // 7. Delete Shop Members, Notifications, Audit Logs
    await this.prisma.shopMember.deleteMany({ where: { shopId } });
    await this.prisma.notification.deleteMany({ where: { shopId } });
    await this.prisma.auditLog.deleteMany({ where: { shopId } });

    // 8. Delete Shop
    return this.prisma.shop.delete({ where: { id: shopId } });
  }
}
