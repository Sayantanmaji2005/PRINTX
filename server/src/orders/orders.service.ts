import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  PaperSize,
  ColorMode,
  PrintSide,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  PrintJobStatus,
  PrinterStatus,
} from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CalculatePriceDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  paperSize: PaperSize;

  @IsString()
  @IsNotEmpty()
  colorMode: ColorMode;

  @IsString()
  @IsNotEmpty()
  printSide: PrintSide;

  @IsNumber()
  @IsOptional()
  copies?: number;

  @IsString()
  @IsOptional()
  pageRange?: string;
}

export class CreateOrderDto extends CalculatePriceDto {
  @IsString()
  @IsNotEmpty()
  customerSessionId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private parsePageCount(pageRange: string | undefined, totalDocumentPages: number): number {
    if (!pageRange || pageRange.trim().toLowerCase() === 'all') {
      return totalDocumentPages;
    }

    try {
      const pages = new Set<number>();
      const parts = pageRange.split(',');

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map((s) => parseInt(s.trim(), 10));
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = Math.max(1, start); i <= Math.min(totalDocumentPages, end); i++) {
              pages.add(i);
            }
          }
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalDocumentPages) {
            pages.add(pageNum);
          }
        }
      }

      return pages.size > 0 ? pages.size : totalDocumentPages;
    } catch {
      return totalDocumentPages;
    }
  }

  async calculatePrice(dto: CalculatePriceDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const pagesToPrint = this.parsePageCount(dto.pageRange, document.pageCount);
    const copies = Math.max(1, Math.min(dto.copies || 1, 100));

    // Calculate sheets needed (Duplex prints 2 pages per physical sheet)
    const sheetsPerCopy =
      dto.printSide === PrintSide.DOUBLE
        ? Math.ceil(pagesToPrint / 2)
        : pagesToPrint;
    const totalSheets = sheetsPerCopy * copies;

    // Find shop pricing rule
    const pricingRule = await this.prisma.pricingRule.findFirst({
      where: {
        shopId: dto.shopId,
        paperSize: dto.paperSize,
        colorMode: dto.colorMode,
        printSide: dto.printSide,
        isActive: true,
      },
    });

    // Default rate if not explicitly configured
    let pricePerUnit = 1.0;
    if (pricingRule) {
      pricePerUnit = pricingRule.pricePerUnit;
    } else {
      if (dto.colorMode === ColorMode.COLOR) {
        pricePerUnit = dto.printSide === PrintSide.DOUBLE ? 8.0 : 5.0;
      } else {
        pricePerUnit = dto.printSide === PrintSide.DOUBLE ? 1.5 : 1.0;
      }
    }

    const subtotal = Number((totalSheets * pricePerUnit).toFixed(2));
    const serviceFee = 0;
    const tax = 0;
    const total = Number((subtotal + serviceFee + tax).toFixed(2));

    return {
      pagesToPrint,
      copies,
      sheetsPerCopy,
      totalSheets,
      pricePerUnit,
      subtotal,
      serviceFee,
      tax,
      total,
      currency: 'INR',
    };
  }

  async createOrder(dto: CreateOrderDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: dto.shopId },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const priceCalc = await this.calculatePrice(dto);

    // Generate unique Order Number: PX-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PX-${dateStr}-${randomSuffix}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          shopId: dto.shopId,
          customerSessionId: dto.customerSessionId,
          documentId: dto.documentId,
          status: OrderStatus.CREATED,
          paymentStatus: PaymentStatus.PENDING,
          printStatus: PrintJobStatus.WAITING,
          subtotal: priceCalc.subtotal,
          serviceFee: priceCalc.serviceFee,
          tax: priceCalc.tax,
          total: priceCalc.total,
          currency: 'INR',
        },
      });

      await tx.printConfiguration.create({
        data: {
          orderId: order.id,
          paperSize: dto.paperSize,
          colorMode: dto.colorMode,
          printSide: dto.printSide,
          copies: priceCalc.copies,
          pageRange: dto.pageRange || 'all',
          totalPages: priceCalc.pagesToPrint,
          totalSheets: priceCalc.totalSheets,
          orientation: document.detectedOrientation,
          customNotes: dto.notes,
        },
      });

      // Generate UPI Intent String & QR URL
      const upiId = shop.upiId || 'printx@upi';
      const upiIntentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop.name)}&am=${priceCalc.total}&tn=Order_${orderNumber}&cu=INR`;
      const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiIntentUrl)}`;

      return {
        ...order,
        configuration: {
          paperSize: dto.paperSize,
          colorMode: dto.colorMode,
          printSide: dto.printSide,
          copies: priceCalc.copies,
          pageRange: dto.pageRange || 'all',
          totalPages: priceCalc.pagesToPrint,
          totalSheets: priceCalc.totalSheets,
        },
        upi: {
          upiId,
          payeeName: shop.name,
          amount: priceCalc.total,
          intentUrl: upiIntentUrl,
          qrCodeUrl: upiQrUrl,
        },
      };
    });
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            upiId: true,
          },
        },
        document: {
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            pageCount: true,
            mimeType: true,
            fileKey: true,
          },
        },
        configuration: true,
        payments: true,
        printJobs: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    return order;
  }

  async markOrderPaid(orderNumber: string, transactionId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        shop: true,
        configuration: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.SUCCESS && order.status === OrderStatus.PAID) {
      return order;
    }

    const txId = transactionId || `TXN-UPI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const paymentIdemKey = `PAY-IDEM-${order.orderNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const jobJobId = `PJ-${order.orderNumber}-${Date.now().toString().slice(-4)}`;
    const printJobIdemKey = `PJ-IDEM-${order.orderNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Record Payment if not already recorded
    try {
      const existingPayment = await this.prisma.payment.findFirst({
        where: { orderId: order.id, status: PaymentStatus.SUCCESS },
      });

      if (!existingPayment) {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            currency: 'INR',
            status: PaymentStatus.SUCCESS,
            provider: PaymentProvider.PHONEPE,
            providerPaymentId: txId,
            idempotencyKey: paymentIdemKey,
            verifiedAt: new Date(),
          },
        });
      }
    } catch (payErr: any) {
      // Ignore duplicate payment creation error
    }

    // 2. Find ready printer for shop
    const printer = await this.prisma.printer.findFirst({
      where: { shopId: order.shopId, status: PrinterStatus.READY },
    });

    // 3. Create Print Job in Queue (Ready for Desktop Agent) if not existing
    try {
      const existingJob = await this.prisma.printJob.findFirst({
        where: { orderId: order.id },
      });

      if (!existingJob) {
        await this.prisma.printJob.create({
          data: {
            jobId: jobJobId,
            orderId: order.id,
            printerId: printer ? printer.id : undefined,
            status: PrintJobStatus.QUEUED,
            idempotencyKey: printJobIdemKey,
            startedAt: new Date(),
          },
        });
      } else {
        await this.prisma.printJob.update({
          where: { id: existingJob.id },
          data: { status: PrintJobStatus.QUEUED },
        });
      }
    } catch (jobErr: any) {
      // Ignore duplicate job creation error
    }

    // 4. Update Order status to PAID & QUEUED
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.SUCCESS,
        printStatus: PrintJobStatus.QUEUED,
      },
      include: {
        configuration: true,
        payments: true,
        printJobs: true,
      },
    });

    return updatedOrder;
  }
}
