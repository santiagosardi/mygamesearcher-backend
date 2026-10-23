import { IsInt, IsPositive, ValidateIf } from 'class-validator';

export class RecomendacionIaDto {
  @ValidateIf(
    (_object: RecomendacionIaDto, value: unknown) => value !== undefined,
  )
  @IsInt()
  @IsPositive()
  coleccionId?: number;
}
