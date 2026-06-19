import { IsInt, IsString, Max, Min } from 'class-validator';

export class CartItemDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  @Max(100_000_000)
  unitPriceCents!: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}
