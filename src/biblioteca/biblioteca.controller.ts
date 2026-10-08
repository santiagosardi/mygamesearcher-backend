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
import { BibliotecaService } from './biblioteca.service';
import { CreateBibliotecaDto } from './dto/create-biblioteca.dto';
import { UpdateBibliotecaDto } from './dto/update-biblioteca.dto';

@Controller('bibliotecas')
@UseGuards(JwtAuthGuard)
export class BibliotecaController {
  constructor(private readonly bibliotecaService: BibliotecaService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.bibliotecaService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.bibliotecaService.findOne(id, user.id);
  }

  @Post()
  create(
    @Body() dto: CreateBibliotecaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.bibliotecaService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBibliotecaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.bibliotecaService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PersonalQueryDto = {},
  ) {
    void query;
    return this.bibliotecaService.remove(id, user.id);
  }
}
