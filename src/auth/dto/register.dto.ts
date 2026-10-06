import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { CreateUsuarioDto } from '../../usuario/dto/create-usuario.dto';

export class RegisterDto extends CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
