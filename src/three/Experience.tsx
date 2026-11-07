// La escena 3D: un canvas fijo detrás de todo el sitio, decorativo (aria-hidden). Se carga con lazy() desde
// App, así three no entra al paquete principal. Se comunica con la capa DOM solo a través de `rig`.
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { LIGHT } from '../game/theme.js';
import { rig } from '../scroll/rig';
import { useUI } from '../state/store';
import { CameraRig } from './CameraRig';
import { GrayBar } from './gray/GrayBar';
import { useFontsReady } from './useFontsReady';
import { World } from './world/World';

/** Con movimiento reducido el canvas dibuja a pedido: el director pide un cuadro cuando cambia de sección. */
function FrameBridge() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    rig.requestFrame = () => invalidate();
    return () => {
      rig.requestFrame = () => {};
    };
  }, [invalidate]);
  return null;
}

// `?gris`: la escena gris de la fase 5, para ajustar tiempos y encuadres sin el arte.
const GRAY = new URLSearchParams(location.search).has('gris');

export default function Experience() {
  const tier = useUI((s) => s.tier);
  const fontsReady = useFontsReady();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; // este módulo solo corre en el cliente
  return (
    <div className="stage" aria-hidden="true">
      {fontsReady && (
        <Canvas
          dpr={tier === 'high' ? [1, 2] : 1}
          frameloop={reduce ? 'demand' : 'always'}
          camera={{ fov: 50, near: 0.02, far: 40, position: [0, 2, 5] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = LIGHT.exposure; // la exposición del juego
            // ?debug: el renderer queda a mano para medir draw calls y triángulos (scripts/capture.mjs).
            if (useUI.getState().debug) (window as unknown as { __gl: unknown }).__gl = gl;
          }}
        >
          {GRAY ? <GrayBar /> : <World />}
          <CameraRig />
          <FrameBridge />
        </Canvas>
      )}
    </div>
  );
}
