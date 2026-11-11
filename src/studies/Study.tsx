// Estudios de dirección (fase 2). Se cargan aparte, solo con `?estudio=a|b|c`.
import '../styles/estudios.css';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GAME_URL } from '../content/links';
import { useFontsReady } from '../three/useFontsReady';
import type { StudyId } from './route';
import { StudyA } from './StudyA';
import { StudyB } from './StudyB';
import { StudyC } from './StudyC';

const SCENES: Record<StudyId, typeof StudyA> = { a: StudyA, b: StudyB, c: StudyC };

const COPY: Record<StudyId, { nombre: string; titulo: string; bajada: string }> = {
  a: {
    nombre: 'La puerta',
    titulo: 'Truco de verdad.',
    bajada: 'Trukeados es truco argentino online, en 3D, en la mesa de un bar. Gratis, en el navegador y en el celular.',
  },
  b: {
    nombre: 'Desde arriba',
    titulo: 'Todo pasa en el paño.',
    bajada: 'Cartas, caras y señas, vistas desde arriba: la mesa como la ves cuando jugás.',
  },
  c: {
    nombre: 'Caras',
    titulo: 'Te están mirando.',
    bajada: 'Cacho guiña un ojo: ancho de basto. La seña solo la ve quien lo está mirando.',
  },
};

export function Study({ id }: { id: StudyId }) {
  const Scene = SCENES[id];
  const c = COPY[id];
  const fontsReady = useFontsReady();
  return (
    <>
      <div className="estudio-canvas" aria-hidden="true">
        {fontsReady && (
          <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        )}
      </div>
      <main className={`estudio estudio--${id}`}>
        <p className="estudio__meta">
          Estudio {id.toUpperCase()} · {c.nombre}
        </p>
        <div className="estudio__texto">
          <h1>{c.titulo}</h1>
          <p>{c.bajada}</p>
          <div className="estudio__acciones">
            <a className="btn btn--primary btn--big" href={GAME_URL}>
              Jugar ahora
            </a>
            <a className="btn btn--secondary btn--big" href={GAME_URL}>
              Practicar con bots
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
