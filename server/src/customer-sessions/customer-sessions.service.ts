import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { ShopStatus, CustomerSessionData } from '@/types';

@Injectable()
export class CustomerSessionsService {
  constructor(private prisma: PrismaService) {}

  async startSession(
    dto: StartSessionDto,
    ipAddress?: string,
  ): Promise<CustomerSessionData> {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: dto.shopSlug.toLowerCase().trim() },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with handle '${dto.shopSlug}' not found`);
    }

    if (shop.status !== ShopStatus.ACTIVE) {
      throw new ForbiddenException(`Shop is currently ${shop.status.toLowerCase()}`);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (shop.retentionHours || 24));

    const session = await this.prisma.customerSession.create({
      data: {
        shopId: shop.id,
        customerPhone: dto.customerPhone?.trim(),
        userAgent: dto.userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return {
      id: session.id,
      shopId: shop.id,
      shopName: shop.name,
      shopSlug: shop.slug,
      customerPhone: session.customerPhone,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async getSession(id: string) {
    const session = await this.prisma.customerSession.findUnique({
      where: { id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            status: true,
            upiId: true,
          },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            configuration: true,
            payments: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Customer session not found or expired');
    }

    if (new Date() > new Date(session.expiresAt)) {
      throw new ForbiddenException('Customer session has expired');
    }

    return session;
  }
}
