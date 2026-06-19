import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CartDto } from './cart.dto';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  couponCode!: string;

  @ValidateNested()
  @Type(() => CartDto)
  cart!: CartDto;
}
