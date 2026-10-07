import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PersonalQueryDto } from '../auth/dto/personal-query.dto';
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
  UseGuards,
} from '@nestjs/common';
import { ColeccionService } from './coleccion.service';
import { CreateColeccionDto } from './dto/create-coleccion.dto';
import { UpdateColeccionDto } from './dto/update-coleccion.dto';

@Controller('colecciones')
@UseGuards(JwtAuthGuard)
export class ColeccionController {
  constructor(private readonly coleccionService: ColeccionService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.coleccionService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.coleccionService.findOne(id, user.id);
  }

  @Post()
  create(
    @Body() dto: CreateColeccionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.coleccionService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColeccionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.coleccionService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.coleccionService.remove(id, user.id);
  }
}
