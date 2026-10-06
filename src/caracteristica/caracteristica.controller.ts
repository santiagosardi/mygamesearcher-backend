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
import { CaracteristicaService } from './caracteristica.service';
import { CreateCaracteristicaDto } from './dto/create-caracteristica.dto';
import { UpdateCaracteristicaDto } from './dto/update-caracteristica.dto';

@Controller('caracteristicas')
export class CaracteristicaController {
  constructor(private readonly caracteristicaService: CaracteristicaService) {}

  @Get()
  findAll() {
    return this.caracteristicaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.caracteristicaService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCaracteristicaDto) {
    return this.caracteristicaService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCaracteristicaDto,
  ) {
    return this.caracteristicaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.caracteristicaService.remove(id);
  }
}
