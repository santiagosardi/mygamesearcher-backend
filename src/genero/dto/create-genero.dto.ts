import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGeneroDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
