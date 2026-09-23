import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Shop slug is required' })
  shopSlug: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
