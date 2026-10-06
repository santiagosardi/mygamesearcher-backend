import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ColeccionService } from './coleccion.service';
import { CreateColeccionDto } from './dto/create-coleccion.dto';
import { UpdateColeccionDto } from './dto/update-coleccion.dto';

@Controller('colecciones')
export class ColeccionController {
  constructor(private readonly coleccionService: ColeccionService) {}

  @Get()
  findAll(
    @Query('usuarioId', new ParseIntPipe({ optional: true }))
    usuarioId?: number,
  ) {
    return this.coleccionService.findAll(usuarioId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coleccionService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateColeccionDto) {
    return this.coleccionService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColeccionDto,
  ) {
    return this.coleccionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coleccionService.remove(id);
  }
}
