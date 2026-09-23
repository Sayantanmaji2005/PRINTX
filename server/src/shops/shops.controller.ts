import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, UserRole } from '@/types';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Roles(UserRole.SHOP_OWNER, UserRole.SUPER_ADMIN)
  @Post()
  async createShop(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateShopDto,
  ) {
    const shop = await this.shopsService.createShop(user.id, dto);
    return {
      message: 'Shop created successfully with default pricing and QR code',
      data: shop,
    };
  }

  @Public()
  @Get('public/:slug')
  async getShopBySlug(@Param('slug') slug: string) {
    const shop = await this.shopsService.findBySlug(slug);
    return {
      message: 'Shop information fetched successfully',
      data: shop,
    };
  }

  @Public()
  @Get('all')
  async getAllShops() {
    const shops = await this.shopsService.listAllShops();
    return {
      message: 'Shops list retrieved',
      data: shops,
    };
  }

  @Get(':id')
  async getShopById(@Param('id') id: string) {
    const shop = await this.shopsService.findById(id);
    return {
      message: 'Shop details retrieved',
      data: shop,
    };
  }

  @Patch(':id')
  async updateShop(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateShopDto,
  ) {
    const shop = await this.shopsService.updateShop(id, user, dto);
    return {
      message: 'Shop updated successfully',
      data: shop,
    };
  }

  @Public()
  @Get(':id/pricing')
  async getShopPricing(@Param('id') id: string) {
    const pricing = await this.shopsService.getPricing(id);
    return {
      message: 'Pricing rules retrieved',
      data: pricing,
    };
  }

  @Public()
  @Get(':id/printers/status')
  async getPrintersStatus(@Param('id') id: string) {
    const printers = await this.shopsService.getPrintersStatus(id);
    return {
      message: 'Printer statuses retrieved',
      data: printers,
    };
  }
}
