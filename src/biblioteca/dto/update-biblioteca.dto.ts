import { IsBoolean, IsEnum, ValidateIf } from 'class-validator';
import { EstadoBiblioteca } from '../estado-biblioteca.enum';

export class UpdateBibliotecaDto {
  @ValidateIf(
    (_object: UpdateBibliotecaDto, value: unknown) => value !== undefined,
  )
  @IsEnum(EstadoBiblioteca)
  estado?: EstadoBiblioteca;

  @ValidateIf(
    (_object: UpdateBibliotecaDto, value: unknown) => value !== undefined,
  )
  @IsBoolean()
  favorito?: boolean;
}
