import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { EstadoBiblioteca } from '../estado-biblioteca.enum';

export class CreateBibliotecaDto {
  @IsInt()
  @IsPositive()
  usuarioId!: number;

  @IsInt()
  @IsPositive()
  juegoId!: number;

  @ValidateIf(
    (_object: CreateBibliotecaDto, value: unknown) => value !== undefined,
  )
  @IsEnum(EstadoBiblioteca)
  estado?: EstadoBiblioteca;

  @ValidateIf(
    (_object: CreateBibliotecaDto, value: unknown) => value !== undefined,
  )
  @IsBoolean()
  favorito?: boolean;
}
