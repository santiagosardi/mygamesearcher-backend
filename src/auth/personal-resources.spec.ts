import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Biblioteca } from '../biblioteca/biblioteca.entity';
import { BibliotecaService } from '../biblioteca/biblioteca.service';
import { BibliotecaController } from '../biblioteca/biblioteca.controller';
import { Coleccion } from '../coleccion/coleccion.entity';
import { ColeccionService } from '../coleccion/coleccion.service';
import { ColeccionController } from '../coleccion/coleccion.controller';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { RecomendacionController } from '../recomendacion/recomendacion.controller';
import { RecomendacionService } from '../recomendacion/recomendacion.service';
import { CreateBibliotecaDto } from '../biblioteca/dto/create-biblioteca.dto';
import { CreateColeccionDto } from '../coleccion/dto/create-coleccion.dto';
import { PersonalQueryDto } from './dto/personal-query.dto';
import { RecomendacionQueryDto } from '../recomendacion/dto/recomendacion-query.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import type { AuthenticatedUser } from './auth.types';

describe.each([
  { entidad: Biblioteca, servicio: BibliotecaService },
  { entidad: Coleccion, servicio: ColeccionService },
])('Ownership de $entidad', ({ entidad, servicio }) => {
  const em = { flush: jest.fn(), remove: jest.fn(), persist: jest.fn() };
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    getEntityManager: () => em,
  };
  let service: BibliotecaService | ColeccionService;
  beforeEach(async () => {
    jest.clearAllMocks();
    repository.find.mockResolvedValue([]);
    repository.findOne.mockImplementation((filtro: { usuario: number }) =>
      Promise.resolve(
        filtro.usuario === 2 ? Object.assign(new entidad(), { id: 7 }) : null,
      ),
    );
    const module = await Test.createTestingModule({
      providers: [
        servicio,
        { provide: getRepositoryToken(entidad), useValue: repository },
        { provide: getRepositoryToken(Usuario), useValue: {} },
        { provide: getRepositoryToken(Juego), useValue: {} },
      ],
    }).compile();
    service = module.get<BibliotecaService | ColeccionService>(servicio);
  });
  it('listado filtra siempre por usuario autenticado', async () => {
    await service.findAll(1);
    expect(repository.find).toHaveBeenCalledWith(
      { usuario: 1 },
      expect.any(Object),
    );
  });
  it('solo el dueño puede leer el recurso', async () => {
    await expect(service.findOne(7, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findOne(7, 2)).resolves.toHaveProperty('id', 7);
    expect(repository.findOne).toHaveBeenCalledWith(
      { id: 7, usuario: 1 },
      expect.any(Object),
    );
  });
  it('PATCH ajeno falla antes de modificar o guardar', async () => {
    await expect(service.update(7, {}, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(em.flush).not.toHaveBeenCalled();
  });
  it('DELETE ajeno falla antes de eliminar', async () => {
    await expect(service.remove(7, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(em.remove).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });
});

describe('Identidad de controllers personales', () => {
  const biblioteca = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const coleccion = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const recomendaciones = { recomendar: jest.fn() };
  let b: BibliotecaController;
  let c: ColeccionController;
  let r: RecomendacionController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [
        BibliotecaController,
        ColeccionController,
        RecomendacionController,
      ],
      providers: [
        { provide: BibliotecaService, useValue: biblioteca },
        { provide: ColeccionService, useValue: coleccion },
        { provide: RecomendacionService, useValue: recomendaciones },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    b = module.get(BibliotecaController);
    c = module.get(ColeccionController);
    r = module.get(RecomendacionController);
  });
  it.each([RolUsuario.USER, RolUsuario.ADMIN])(
    'usa identidad propia para %s en todas las operaciones',
    (rol) => {
      const user: AuthenticatedUser = {
        id: 3,
        nombre: 'Ana',
        email: 'ana@example.com',
        rol,
        activo: true,
        fechaCreacion: new Date(),
      };
      void b.findAll(user, {});
      void c.findAll(user, {});
      void b.create({ juegoId: 5 }, user);
      void c.create({ nombre: 'Favoritos' }, user);
      void b.findOne(7, user);
      void c.findOne(7, user);
      void b.update(7, {}, user);
      void c.update(7, {}, user);
      void b.remove(7, user);
      void c.remove(7, user);
      for (const mock of [biblioteca, coleccion]) {
        expect(mock.findAll).toHaveBeenCalledWith(3);
        expect(mock.findOne).toHaveBeenCalledWith(7, 3);
        expect(mock.update).toHaveBeenCalledWith(7, {}, 3);
        expect(mock.remove).toHaveBeenCalledWith(7, 3);
      }
      expect(biblioteca.create).toHaveBeenCalledWith({ juegoId: 5 }, 3);
      expect(coleccion.create).toHaveBeenCalledWith({ nombre: 'Favoritos' }, 3);
      void r.recomendar(user, {});
      void r.recomendar(user, { coleccionId: 2 });
      expect(recomendaciones.recomendar).toHaveBeenCalledWith(3, undefined);
      expect(recomendaciones.recomendar).toHaveBeenCalledWith(3, 2);
    },
  );
});

describe('Contratos sin usuarioId externo', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  it.each([
    { dto: CreateBibliotecaDto, type: 'body' as const, datos: { juegoId: 5 } },
    {
      dto: CreateColeccionDto,
      type: 'body' as const,
      datos: { nombre: 'Favoritos' },
    },
    { dto: PersonalQueryDto, type: 'query' as const, datos: {} },
    { dto: RecomendacionQueryDto, type: 'query' as const, datos: {} },
  ])(
    'acepta nuevo contrato y rechaza usuarioId en $type/$dto',
    async ({ dto, type, datos }) => {
      await expect(
        pipe.transform(datos, { type, metatype: dto }),
      ).resolves.toBeDefined();
      await expect(
        pipe.transform({ ...datos, usuarioId: 2 }, { type, metatype: dto }),
      ).rejects.toMatchObject({ status: 400 });
    },
  );
  it('mantiene validación de coleccionId', async () => {
    await expect(
      pipe.transform(
        { coleccionId: '2' },
        { type: 'query', metatype: RecomendacionQueryDto },
      ),
    ).resolves.toMatchObject({ coleccionId: 2 });
    await expect(
      pipe.transform(
        { coleccionId: '-1' },
        { type: 'query', metatype: RecomendacionQueryDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
