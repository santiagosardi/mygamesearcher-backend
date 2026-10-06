import type { Juego } from '../juego/juego.entity';

export interface Recomendacion {
  juego: Juego;
  puntaje: number;
  motivos: string[];
}

export interface RespuestaRecomendaciones {
  usuarioId: number;
  recomendaciones: Recomendacion[];
  mensaje?: string;
}
