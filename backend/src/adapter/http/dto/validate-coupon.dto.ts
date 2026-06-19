import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CartDto } from './cart.dto';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  couponCode!: string;

  @ValidateNested()
  @Type(() => CartDto)
  cart!: CartDto;
}
