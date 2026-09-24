import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ShopStatus } from '@/types';

export class AdminCreateShopDto {
  name: string;
  slug?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  address?: string;
  upiId?: string;
  retentionHours?: number;
}

@Roles(UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    const data = await this.adminService.getPlatformOverview();
    return {
      message: 'Platform master overview retrieved',
      data,
    };
  }

  @Get('shops')
  async getShops() {
    const data = await this.adminService.getAllShops();
    return {
      message: 'All registered shops retrieved',
      data,
    };
  }

  @Post('shops')
  async createShopByAdmin(@Body() dto: AdminCreateShopDto) {
    const shop = await this.adminService.createShopWithQr(dto);
    return {
      message: 'Xerox shop and unique encrypted QR standee created successfully',
      data: shop,
    };
  }

  @Patch('shops/:id/status')
  async updateShopStatus(
    @Param('id') id: string,
    @Body('status') status: ShopStatus,
  ) {
    const shop = await this.adminService.updateShopStatus(id, status);
    return {
      message: `Shop status updated to ${status}`,
      data: shop,
    };
  }

  @Delete('shops/:id')
  async deleteShop(@Param('id') id: string) {
    const shop = await this.adminService.deleteShopPermanently(id);
    return {
      message: `Shop "${shop.name}" and all related data deleted permanently`,
      data: shop,
    };
  }
}
