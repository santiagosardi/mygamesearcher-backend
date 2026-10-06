import { IsOptional, IsString } from 'class-validator';

export class UpdatePlataformaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
