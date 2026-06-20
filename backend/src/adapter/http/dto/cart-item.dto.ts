import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ example: 'sku-1', description: 'Identificador do item' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Camiseta', description: 'Nome do item' })
  @IsString()
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
