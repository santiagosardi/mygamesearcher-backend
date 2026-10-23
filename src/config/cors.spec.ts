import { isAllowedFrontendOrigin } from './cors';

describe('Orígenes CORS del frontend', () => {
  const production = 'https://mygamesearcher-frontend-fawn.vercel.app';
  const preview =
    'https://mygamesearcher-frontend-git-feature-gam-bf879d-my-game-searcher.vercel.app';

  it.each([
    undefined,
    'http://localhost:5173',
    production,
    preview,
    'https://mygamesearcher-frontend-abc123def-my-game-searcher.vercel.app',
  ])('permite el origen autorizado %p', (origin) => {
    expect(isAllowedFrontendOrigin(origin, production)).toBe(true);
  });

  it.each([undefined, 'http://localhost:5173', preview])(
    'mantiene acceso sin FRONTEND_ORIGIN para %p',
    (origin) => {
      expect(isAllowedFrontendOrigin(origin, undefined)).toBe(true);
    },
  );

  it('acepta FRONTEND_ORIGIN como coincidencia exacta', () => {
    expect(
      isAllowedFrontendOrigin(
        'https://frontend.example',
        'https://frontend.example',
      ),
    ).toBe(true);
    expect(
      isAllowedFrontendOrigin(
        'https://frontend.example.evil.test',
        'https://frontend.example',
      ),
    ).toBe(false);
  });

  it.each([
    'https://evil.example',
    'https://otro-proyecto-abc123-my-game-searcher.vercel.app',
    'https://mygamesearcher-frontend-abc123-otro-equipo.vercel.app',
    'https://mygamesearcher-frontend-fawn.vercel.app.evil.test',
    preview + '.evil.test',
    preview + '/catalogo',
    preview + '?origin=ok',
    preview + ':8443',
    preview.replace('https:', 'http:'),
    preview.replace('https://', 'https://usuario@'),
    'https://mygamesearcher-frontend.vercel.app',
    'http://localhost:5174',
    'null',
    '',
  ])('rechaza el origen no autorizado %p', (origin) => {
    expect(isAllowedFrontendOrigin(origin, production)).toBe(false);
  });
});
