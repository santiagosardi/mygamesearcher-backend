// Los previews deben pertenecer al proyecto y al equipo de Vercel indicados.
const previewOrigin =
  /^https:\/\/mygamesearcher-frontend-[a-z0-9]+(?:-[a-z0-9]+)*-my-game-searcher\.vercel\.app$/;

export function isAllowedFrontendOrigin(
  origin: string | undefined,
  frontendOrigin: string | undefined,
): boolean {
  return (
    origin === undefined ||
    origin === 'http://localhost:5173' ||
    (frontendOrigin !== undefined && origin === frontendOrigin) ||
    previewOrigin.test(origin)
  );
}
