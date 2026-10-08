import { BadRequestException } from '@nestjs/common';
import { getRounds } from 'bcryptjs';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();
  let hashCorrecto: string;

  beforeAll(async () => {
    hashCorrecto = await service.hash('clave123');
  });

  it('genera un hash distinto de la contraseña con costo 12', () => {
    expect(hashCorrecto).not.toBe('clave123');
    expect(getRounds(hashCorrecto)).toBe(12);
  });

  it('valida la contraseña correcta', async () => {
    await expect(service.compare('clave123', hashCorrecto)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(
      service.compare('claveIncorrecta', hashCorrecto),
    ).resolves.toBe(false);
  });

  it('genera salts distintos y ambos hashes validan la misma contraseña', async () => {
    const otroHash = await service.hash('clave123');
    expect(otroHash).not.toBe(hashCorrecto);
    await expect(service.compare('clave123', hashCorrecto)).resolves.toBe(true);
    await expect(service.compare('clave123', otroHash)).resolves.toBe(true);
  });

  it('rechaza contraseñas que bcrypt truncaría, contando bytes UTF-8', async () => {
    await expect(service.hash('á'.repeat(37))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.compare('a'.repeat(73), hashCorrecto)).resolves.toBe(
      false,
    );
  });
});
