import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ShopStatus } from '@/types';

export class UpdateShopDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  upiId?: string;

  @IsEnum(ShopStatus)
  @IsOptional()
  status?: ShopStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  retentionHours?: number;
}
