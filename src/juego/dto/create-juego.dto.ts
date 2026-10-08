import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateJuegoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo!: string;

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsString()
  descripcion?: string;

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fechaLanzamiento?: string;

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(255)
  desarrollador?: string;

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  urlImagen?: string;

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  generoIds?: number[];

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  plataformaIds?: number[];

  @ValidateIf((_object: CreateJuegoDto, value: unknown) => value !== undefined)
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  caracteristicaIds?: number[];
}
