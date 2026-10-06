import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateColeccionDto {
  @IsInt()
  @IsPositive()
  usuarioId!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ValidateIf(
    (_object: CreateColeccionDto, value: unknown) => value !== undefined,
  )
  @IsString()
  descripcion?: string;

  @ValidateIf(
    (_object: CreateColeccionDto, value: unknown) => value !== undefined,
  )
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  juegoIds?: number[];
}
