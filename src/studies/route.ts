// Ruta de los estudios de dirección (fase 2). Módulo liviano: no importa three ni React Three Fiber.
export type StudyId = 'a' | 'b' | 'c';

/** Lee `?estudio=a|b|c`. Sin parámetro, se muestra la landing. */
export function studyFromUrl(): StudyId | null {
  const v = new URLSearchParams(window.location.search).get('estudio');
  return v === 'a' || v === 'b' || v === 'c' ? v : null;
}
