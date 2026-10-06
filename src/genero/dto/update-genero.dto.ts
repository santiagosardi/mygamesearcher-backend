import { IsOptional, IsString } from 'class-validator';

export class UpdateGeneroDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
