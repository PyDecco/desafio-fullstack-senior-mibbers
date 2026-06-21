import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ maxLength: 128, example: 'sku-1', description: 'Identificador do item' })
  @IsString()
  @MaxLength(128)
  id!: string;

  @ApiProperty({ maxLength: 256, example: 'Camiseta', description: 'Nome do item' })
  @IsString()
  @MaxLength(256)
  name!: string;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 100_000_000, example: 19900, description: 'Preco unitario em centavos' })
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  unitPriceCents!: number;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 1000, example: 1, description: 'Quantidade do item' })
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}
