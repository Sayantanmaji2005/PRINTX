import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AgentStatus, PrinterStatus, PrintJobStatus, OrderStatus } from '@prisma/client';

export interface AgentHeartbeatDto {
  shopSlug: string;
  agentName: string;
  hostname?: string;
  ipAddress?: string;
  version?: string;
  printers: Array<{
    name: string;
    driverName?: string;
    isDefault?: boolean;
    status?: string;
    isOnline?: boolean;
  }>;
}

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async handleHeartbeat(dto: AgentHeartbeatDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: dto.shopSlug },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with slug "${dto.shopSlug}" not found`);
    }

    // 1. Upsert PrintAgent entry
    const tokenHash = `agent-${dto.shopSlug}`;
    const agent = await this.prisma.printAgent.upsert({
      where: { tokenHash },
      create: {
        shopId: shop.id,
        name: dto.agentName || 'Shop Desktop Agent',
        tokenHash,
        version: dto.version || '1.0.0',
        hostname: dto.hostname || 'Local-PC',
        ipAddress: dto.ipAddress || '127.0.0.1',
        status: AgentStatus.ONLINE,
        lastHeartbeatAt: new Date(),
      },
      update: {
        name: dto.agentName || 'Shop Desktop Agent',
        version: dto.version || '1.0.0',
        hostname: dto.hostname || 'Local-PC',
        ipAddress: dto.ipAddress || '127.0.0.1',
        status: AgentStatus.ONLINE,
        lastHeartbeatAt: new Date(),
      },
    });

    // 2. Sync detected local printers into DB
    if (dto.printers && dto.printers.length > 0) {
      for (const p of dto.printers) {
        const existing = await this.prisma.printer.findFirst({
          where: { shopId: shop.id, name: p.name },
        });

        const printerStatus = p.isOnline === false ? PrinterStatus.OFFLINE : PrinterStatus.READY;

        if (existing) {
          await this.prisma.printer.update({
            where: { id: existing.id },
            data: {
              driverName: p.driverName || existing.driverName,
              status: printerStatus,
              isDefault: p.isDefault ?? existing.isDefault,
              lastSeenAt: new Date(),
            },
          });
        } else {
          await this.prisma.printer.create({
            data: {
              shopId: shop.id,
              name: p.name,
              driverName: p.driverName,
              connectionType: 'USB',
              status: printerStatus,
              isDefault: p.isDefault ?? false,
              capabilities: JSON.stringify({
                supportedSizes: ['A4', 'LETTER'],
                duplex: true,
              }),
              lastSeenAt: new Date(),
            },
          });
        }
      }
    }

    return {
      success: true,
      agentId: agent.id,
      shopName: shop.name,
      status: agent.status,
      timestamp: new Date().toISOString(),
    };
  }

  async getPendingJobs(shopSlug: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      throw new NotFoundException(`Shop ${shopSlug} not found`);
    }

    // Find orders that are paid and have pending/queued print jobs
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        shopId: shop.id,
        paymentStatus: 'SUCCESS',
        printStatus: { in: [PrintJobStatus.WAITING, PrintJobStatus.QUEUED] },
      },
      include: {
        document: true,
        configuration: true,
        printJobs: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return pendingOrders.map((ord) => ({
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      jobId: ord.printJobs[0]?.jobId || `PJ-${ord.orderNumber}-1`,
      documentId: ord.documentId,
      documentName: ord.document.originalName,
      fileKey: ord.document.fileKey,
      downloadUrl: `/api/documents/file/${ord.document.fileKey}`,
      config: {
        paperSize: ord.configuration?.paperSize || 'A4',
        colorMode: ord.configuration?.colorMode || 'BW',
        printSide: ord.configuration?.printSide || 'SINGLE',
        copies: ord.configuration?.copies || 1,
        pageRange: ord.configuration?.pageRange || 'all',
        totalPages: ord.configuration?.totalPages || ord.document.pageCount,
        orientation: ord.configuration?.orientation || 'PORTRAIT',
      },
      createdAt: ord.createdAt,
    }));
  }

  async updateJobStatus(dto: {
    orderNumber: string;
    jobId?: string;
    status: 'PRINTING' | 'PRINTED' | 'FAILED';
    printerName?: string;
    errorMessage?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber },
      include: { printJobs: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderNumber} not found`);
    }

    const printJobStatus =
      dto.status === 'PRINTED'
        ? PrintJobStatus.PRINTED
        : dto.status === 'PRINTING'
        ? PrintJobStatus.PRINTING
        : PrintJobStatus.FAILED;

    const orderStatus =
      dto.status === 'PRINTED'
        ? OrderStatus.PRINTED
        : dto.status === 'PRINTING'
        ? OrderStatus.PRINTING
        : OrderStatus.FAILED;

    // Update PrintJob
    if (order.printJobs.length > 0) {
      await this.prisma.printJob.update({
        where: { id: order.printJobs[0].id },
        data: {
          status: printJobStatus,
          errorMessage: dto.errorMessage,
          completedAt: dto.status === 'PRINTED' ? new Date() : undefined,
          startedAt: dto.status === 'PRINTING' ? new Date() : undefined,
        },
      });
    }

    // Update Order
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        printStatus: printJobStatus,
      },
    });

    return { success: true, orderNumber: dto.orderNumber, status: printJobStatus };
  }
}
