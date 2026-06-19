import { IsInt, IsString, Min } from 'class-validator';

export class CartItemDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
