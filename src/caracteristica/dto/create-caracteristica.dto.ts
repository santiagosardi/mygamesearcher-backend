import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCaracteristicaDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
