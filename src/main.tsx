// Archivo con los dos ejes (ancho 62–125 y peso 100–900): la marca usa font-stretch.
import '@fontsource-variable/archivo/wdth.css';
import './styles/tokens.css';
import './styles/base.css';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { studyFromUrl } from './studies/route';

// Los estudios de dirección (fase 2) cargan three.js: van en un paquete aparte para no engordar la landing.
const Study = lazy(() => import('./studies/Study').then((m) => ({ default: m.Study })));
const estudio = studyFromUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {estudio ? (
      <Suspense fallback={null}>
        <Study id={estudio} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
