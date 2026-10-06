import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'nombre no puede estar vacío' })
  @MaxLength(100)
  nombre!: string;

  @ValidateIf(
    (_object: CreateUsuarioDto, value: unknown) => value !== undefined,
  )
  @IsString()
  @MaxLength(100)
  apellido?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
