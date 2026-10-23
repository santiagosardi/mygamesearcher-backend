import type { Juego } from '../juego/juego.entity';

export interface RespuestaRecomendacionesIa {
  recomendaciones: { juego: Juego; motivo: string }[];
  mensaje?: string;
}
