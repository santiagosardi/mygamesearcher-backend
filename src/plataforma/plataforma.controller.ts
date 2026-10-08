import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PlataformaService } from './plataforma.service';
import { CreatePlataformaDto } from './dto/create-plataforma.dto';
import { UpdatePlataformaDto } from './dto/update-plataforma.dto';

@Controller('plataformas')
export class PlataformaController {
  constructor(private readonly plataformaService: PlataformaService) {}

  @Get()
  findAll() {
    return this.plataformaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plataformaService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  create(@Body() dto: CreatePlataformaDto) {
    return this.plataformaService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlataformaDto,
  ) {
    return this.plataformaService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plataformaService.remove(id);
  }
}
