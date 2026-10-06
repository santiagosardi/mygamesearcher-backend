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
  create(@Body() dto: CreatePlataformaDto) {
    return this.plataformaService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlataformaDto,
  ) {
    return this.plataformaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plataformaService.remove(id);
  }
}
