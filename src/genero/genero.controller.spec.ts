import { Test } from '@nestjs/testing';
import { GeneroController } from './genero.controller';
import { GeneroService } from './genero.service';
import { Genero } from './genero.entity';

describe('GeneroController', () => {
  let controller: GeneroController;
  let service: jest.Mocked<
    Pick<GeneroService, 'findAll' | 'findOne' | 'create' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [GeneroController],
      providers: [{ provide: GeneroService, useValue: service }],
    }).compile();

    controller = module.get<GeneroController>(GeneroController);
  });

  it('findAll delega al service y devuelve su resultado', async () => {
    const generos: Genero[] = [{ id: 1, nombre: 'RPG' }];
    service.findAll.mockResolvedValue(generos);

    await expect(controller.findAll()).resolves.toBe(generos);
    expect(service.findAll).toHaveBeenCalledWith();
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne delega el id al service y devuelve su resultado', async () => {
    const genero: Genero = { id: 1, nombre: 'RPG' };
    service.findOne.mockResolvedValue(genero);

    await expect(controller.findOne(1)).resolves.toBe(genero);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(service.findOne).toHaveBeenCalledTimes(1);
  });

  it('create delega el DTO al service y devuelve su resultado', async () => {
    const dto = { nombre: 'RPG', descripcion: 'Juegos de rol' };
    const genero: Genero = { id: 1, ...dto };
    service.create.mockResolvedValue(genero);

    await expect(controller.create(dto)).resolves.toBe(genero);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.create).toHaveBeenCalledTimes(1);
  });

  it('update delega el id y DTO al service y devuelve su resultado', async () => {
    const dto = { descripcion: 'Videojuegos de rol' };
    const genero: Genero = { id: 1, nombre: 'RPG', ...dto };
    service.update.mockResolvedValue(genero);

    await expect(controller.update(1, dto)).resolves.toBe(genero);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(service.update).toHaveBeenCalledTimes(1);
  });

  it('remove delega el id al service y devuelve su resultado', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
});
