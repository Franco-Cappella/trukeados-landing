import { create } from 'zustand';

// Estado discreto de la interfaz. Lo continuo (cámara, efectos) vive en scroll/rig.ts y no pasa por React.
export type Tier = 'high' | 'low' | 'static';

export const useUI = create<{
  /** Ya se leyó el navegador (WebGL, parámetros de la URL): recién ahí se decide si se monta la escena. */
  booted: boolean;
  section: number;
  tier: Tier;
  no3d: boolean;
  presenting: boolean;
  /** `?debug`: muestra el estado del director y lo expone para las pruebas de scripts/capture.mjs. */
  debug: boolean;
  setSection: (i: number) => void;
  setTier: (t: Tier) => void;
  toggleNo3d: () => void;
  togglePresenting: () => void;
}>((set) => ({
  booted: false,
  section: 0,
  tier: 'high',
  no3d: false,
  presenting: false,
  debug: false,
  setSection: (section) => set({ section }),
  setTier: (tier) => set({ tier }),
  toggleNo3d: () => set((s) => ({ no3d: !s.no3d })),
  togglePresenting: () => set((s) => ({ presenting: !s.presenting })),
}));

/** Se llama una vez, en un efecto de App: lee WebGL y los parámetros de la URL (?sin3d, ?presentacion, ?debug). */
export function initUIFromBrowser() {
  // Solo se mira que exista la API: abrir un contexto de prueba costaba casi 1 s con la CPU 4 veces más lenta
  // de Lighthouse, y la escena abre su propio contexto de todos modos. Si ese no se puede crear, Experience pasa
  // a la versión estática (ver su ErrorBoundary).
  const webgl = typeof WebGL2RenderingContext !== 'undefined';
  const q = new URLSearchParams(location.search);
  useUI.setState({
    booted: true,
    tier: webgl ? 'high' : 'static',
    no3d: q.has('sin3d'),
    presenting: q.has('presentacion'),
    debug: q.has('debug'),
  });
}
