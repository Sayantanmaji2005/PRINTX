import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '@/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthUser) {
    const data = await this.usersService.findById(user.id);
    return {
      message: 'Profile fetched successfully',
      data,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return {
      message: 'User fetched successfully',
      data,
    };
  }
}
