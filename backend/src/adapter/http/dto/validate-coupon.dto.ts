import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CartDto } from './cart.dto';

export class ValidateCouponDto {
  @ApiProperty({ maxLength: 64, example: 'LANC10', description: 'Normalizado no servidor (trim, zero-width removido, maiusculas); apenas A-Z e 0-9 apos normalizar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  couponCode!: string;

  @ApiProperty({ type: () => CartDto })
  @ValidateNested()
  @Type(() => CartDto)
  cart!: CartDto;
}
