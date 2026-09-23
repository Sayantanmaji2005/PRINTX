import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty({ message: 'Shop name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Shop slug is required' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens (e.g. my-shop-name)',
  })
  slug: string;

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
}
