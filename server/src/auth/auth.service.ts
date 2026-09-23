import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokens, AuthUser, UserRole } from '@/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim(),
        role: dto.role || UserRole.SHOP_OWNER,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        ownedShops: { select: { id: true } },
        shopMemberships: { select: { shopId: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'printx_jwt_super_secret_refresh_key_2026_dev_mode',
        ),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          ownedShops: { select: { id: true } },
          shopMemberships: { select: { shopId: true } },
        },
      });

      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedShops: { select: { id: true, name: true, slug: true } },
        shopMemberships: { select: { shopId: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_SECRET',
        'printx_jwt_super_secret_access_key_2026_dev_mode',
      ),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'printx_jwt_super_secret_refresh_key_2026_dev_mode',
      ),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Save hashed refresh token to user
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const shopId =
      user.ownedShops?.[0]?.id || user.shopMemberships?.[0]?.shopId || null;

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        shopId,
      },
    };
  }
}
