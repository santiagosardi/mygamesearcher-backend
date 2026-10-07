import { Type } from 'class-transformer';
import { IsInt, IsPositive, ValidateIf } from 'class-validator';

export class RecomendacionQueryDto {
  @ValidateIf(
    (_object: RecomendacionQueryDto, value: unknown) => value !== undefined,
  )
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  coleccionId?: number;
}
