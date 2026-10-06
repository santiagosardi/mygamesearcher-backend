import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Genero } from './genero.entity';
import { GeneroService } from './genero.service';

describe('GeneroService', () => {
  let service: GeneroService;
  let entityManager: {
    persist: jest.Mock<void, [Genero]>;
    flush: jest.Mock<Promise<void>, []>;
    remove: jest.Mock<void, [Genero]>;
  };
  let repository: {
    findAll: jest.Mock<Promise<Genero[]>, []>;
    findOne: jest.Mock<
      Promise<Genero | null>,
      [{ id?: number; nombre?: string }]
    >;
    getEntityManager: jest.Mock<typeof entityManager, []>;
  };

  beforeEach(async () => {
    entityManager = {
      persist: jest.fn<void, [Genero]>(),
      flush: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
      remove: jest.fn<void, [Genero]>(),
    };
    repository = {
      findAll: jest.fn<Promise<Genero[]>, []>(),
      findOne: jest.fn<
        Promise<Genero | null>,
        [{ id?: number; nombre?: string }]
      >(),
      getEntityManager: jest
        .fn<typeof entityManager, []>()
        .mockReturnValue(entityManager),
    };
    const module = await Test.createTestingModule({
      providers: [
        GeneroService,
        { provide: getRepositoryToken(Genero), useValue: repository },
      ],
    }).compile();

    service = module.get<GeneroService>(GeneroService);
  });

  it('findAll devuelve los géneros', async () => {
    const generos: Genero[] = [{ id: 1, nombre: 'RPG' }];
    repository.findAll.mockResolvedValue(generos);

    await expect(service.findAll()).resolves.toBe(generos);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  it('findOne devuelve un género existente', async () => {
    const genero: Genero = { id: 1, nombre: 'RPG' };
    repository.findOne.mockResolvedValue(genero);

    await expect(service.findOne(1)).resolves.toBe(genero);
    expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
  });

  it('findOne lanza NotFoundException si no existe', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create crea y guarda un género', async () => {
    const dto = { nombre: 'RPG', descripcion: 'Juegos de rol' };
    repository.findOne.mockResolvedValue(null);

    const genero = await service.create(dto);

    expect(genero).toBeInstanceOf(Genero);
    expect(genero.nombre).toBe(dto.nombre);
    expect(genero.descripcion).toBe(dto.descripcion);
    expect(repository.findOne).toHaveBeenCalledWith({ nombre: dto.nombre });
    expect(entityManager.persist).toHaveBeenCalledWith(genero);
    expect(entityManager.flush).toHaveBeenCalledTimes(1);
  });

  it('create lanza ConflictException si el nombre ya existe', async () => {
    repository.findOne.mockResolvedValue({ id: 1, nombre: 'RPG' });

    await expect(service.create({ nombre: 'RPG' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(entityManager.persist).not.toHaveBeenCalled();
    expect(entityManager.flush).not.toHaveBeenCalled();
  });

  it('update cambia la descripción y conserva el nombre omitido', async () => {
    const genero: Genero = {
      id: 1,
      nombre: 'RPG',
      descripcion: 'Juegos de rol',
    };
    repository.findOne.mockResolvedValue(genero);

    const actualizado = await service.update(1, {
      descripcion: 'Videojuegos de rol',
    });

    expect(actualizado).toBe(genero);
    expect(actualizado.nombre).toBe('RPG');
    expect(actualizado.descripcion).toBe('Videojuegos de rol');
    expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
    expect(entityManager.flush).toHaveBeenCalledTimes(1);
  });

  it('remove elimina el género y no devuelve contenido', async () => {
    const genero: Genero = { id: 1, nombre: 'RPG' };
    repository.findOne.mockResolvedValue(genero);

    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
    expect(entityManager.remove).toHaveBeenCalledWith(genero);
    expect(entityManager.flush).toHaveBeenCalledTimes(1);
  });
});
