import { IsString, ValidateIf } from 'class-validator';

export class JuegoQueryDto {
  @ValidateIf((_object: JuegoQueryDto, value: unknown) => value !== undefined)
  @IsString()
  buscar?: string;
}
