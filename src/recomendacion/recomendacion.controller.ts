import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RecomendacionQueryDto } from './dto/recomendacion-query.dto';
import { RecomendacionService } from './recomendacion.service';

@Controller('recomendaciones')
@UseGuards(JwtAuthGuard)
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  @Get()
  recomendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecomendacionQueryDto,
  ) {
    return this.recomendacionService.recomendar(user.id, query.coleccionId);
  }
}
