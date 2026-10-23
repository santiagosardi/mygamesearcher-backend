import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RecomendacionQueryDto } from './dto/recomendacion-query.dto';
import { RecomendacionService } from './recomendacion.service';

import { RecomendacionIaService } from './recomendacion-ia.service';
import { RecomendacionIaDto } from './dto/recomendacion-ia.dto';

@Controller('recomendaciones')
@UseGuards(JwtAuthGuard)
export class RecomendacionController {
  constructor(
    private readonly recomendacionService: RecomendacionService,
    private readonly recomendacionIaService: RecomendacionIaService,
  ) {}

  @Post('ia')
  @HttpCode(200)
  recomendarIa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecomendacionIaDto,
  ) {
    return this.recomendacionIaService.recomendar(user.id, dto.coleccionId);
  }

  @Get()
  recomendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecomendacionQueryDto,
  ) {
    return this.recomendacionService.recomendar(user.id, query.coleccionId);
  }
}
