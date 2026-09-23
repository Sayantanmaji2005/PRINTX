import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '@/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ||
      'printx_jwt_super_secret_access_key_2026_dev_mode';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }): Promise<AuthUser> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          ownedShops: { select: { id: true } },
          shopMemberships: { select: { shopId: true } },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User account not found');
      }

      const shopId = user.ownedShops[0]?.id || user.shopMemberships[0]?.shopId || null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as any,
        shopId,
      };
    } catch (err: any) {
      this.logger.error(`JWT validation error: ${err.message}`);
      throw new UnauthorizedException(err.message);
    }
  }
}
