import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { JuegoService } from './juego.service';
import { CreateJuegoDto } from './dto/create-juego.dto';
import { UpdateJuegoDto } from './dto/update-juego.dto';

@Controller('juegos')
export class JuegoController {
  constructor(private readonly juegoService: JuegoService) {}

  @Get()
  findAll() {
    return this.juegoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.juegoService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJuegoDto) {
    return this.juegoService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJuegoDto) {
    return this.juegoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.juegoService.remove(id);
  }
}
