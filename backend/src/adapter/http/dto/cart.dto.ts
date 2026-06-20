import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty({ type: () => CartItemDto, isArray: true, minItems: 1, maxItems: 200 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ApiPropertyOptional({ type: 'integer', minimum: 0, example: 19900, description: 'Se enviado, deve bater com o subtotal recalculado no servidor, senao 422' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalCents?: number;
}
