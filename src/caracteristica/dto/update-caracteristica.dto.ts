import { IsOptional, IsString } from 'class-validator';

export class UpdateCaracteristicaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
