import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlataformaDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
