import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { RecomendacionService } from './recomendacion.service';

@Controller('recomendaciones')
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  @Get()
  recomendar(@Query('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.recomendacionService.recomendar(usuarioId);
  }
}
