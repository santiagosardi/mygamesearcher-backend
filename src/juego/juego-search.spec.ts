import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Juego } from './juego.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { JuegoService } from './juego.service';
import { JuegoController } from './juego.controller';
import { JuegoQueryDto } from './dto/juego-query.dto';

describe('Búsqueda del catálogo', () => {
  let service: JuegoService;
  let controller: JuegoController;
  const repository = { find: jest.fn(), findAll: jest.fn() };
  const populate = ['generos', 'plataformas', 'caracteristicas'];

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        JuegoService,
        { provide: getRepositoryToken(Juego), useValue: repository },
        ...[Genero, Plataforma, Caracteristica].map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: {},
        })),
      ],
    }).compile();
    service = module.get(JuegoService);
    controller = new JuegoController(service);
  });

  it.each([undefined, '', '   '])(
    'mantiene el listado completo para buscar=%p',
    async (buscar) => {
      const juegos = [
        Object.assign(new Juego(), { id: 1, titulo: 'Minecraft' }),
      ];
      repository.findAll.mockResolvedValue(juegos);
      await expect(controller.findAll({ buscar })).resolves.toBe(juegos);
      expect(repository.findAll).toHaveBeenCalledWith({ populate });
      expect(repository.find).not.toHaveBeenCalled();
    },
  );

  it.each(['mine', '  mine  '])(
    'envía la búsqueda parcial %p a MySQL conservando las relaciones',
    async (buscar) => {
      const juegos = [
        Object.assign(new Juego(), { id: 1, titulo: 'Minecraft' }),
      ];
      repository.find.mockResolvedValue(juegos);
      await expect(controller.findAll({ buscar })).resolves.toBe(juegos);
      expect(repository.find).toHaveBeenCalledWith(
        { titulo: { $like: '%mine%' } },
        { populate },
      );
      expect(repository.findAll).not.toHaveBeenCalled();
    },
  );

  it('devuelve una lista vacía si el repositorio no encuentra coincidencias', async () => {
    repository.find.mockResolvedValue([]);
    await expect(
      controller.findAll({ buscar: 'inexistente' }),
    ).resolves.toEqual([]);
    expect(repository.find).toHaveBeenCalledWith(
      { titulo: { $like: '%inexistente%' } },
      { populate },
    );
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('escapa los comodines LIKE presentes en el término', async () => {
    repository.find.mockResolvedValue([]);
    await service.findAll('100%_');
    expect(repository.find).toHaveBeenCalledWith(
      { titulo: { $like: '%100\\%\\_%' } },
      { populate },
    );
  });

  it('rechaza buscar repetido como array mediante el pipe global', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    await expect(
      pipe.transform(
        { buscar: ['mine', 'craft'] },
        { type: 'query', metatype: JuegoQueryDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
