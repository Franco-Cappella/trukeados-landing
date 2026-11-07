// La escena 3D: un canvas fijo detrás de todo el sitio, decorativo (aria-hidden). Se carga con lazy() desde
// App, así three no entra al paquete principal. Se comunica con la capa DOM solo a través de `rig`.
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { LIGHT } from '../game/theme.js';
import { rig } from '../scroll/rig';
import { useUI } from '../state/store';
import { CameraRig } from './CameraRig';
import { GrayBar } from './gray/GrayBar';
import { useFontsReady } from './useFontsReady';
import { castStats } from './world/cast';
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

/** Marca el escenario como listo después del primer cuadro: el CSS lo hace aparecer con un fundido. */
function StageReady() {
  const gl = useThree((s) => s.gl);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    gl.domElement.closest('.stage')?.setAttribute('data-listo', '');
  });
  return null;
}

/** Compila los shaders antes del primer cuadro sin trabar la página: con KHR_parallel_shader_compile (Chrome,
 *  Safari) el driver los compila aparte; sin la extensión, compileAsync compila igual que el primer render.
 *  Mientras tanto el canvas no dibuja (frameloop "never"). Si algo tarda de más, arranca igual a los 4 s. */
function Warmup({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onDone();
    };
    gl.compileAsync(scene, camera).then(finish, finish);
    const t = setTimeout(finish, 4000);
    return () => {
      done = true;
      clearTimeout(t);
    };
  }, [gl, scene, camera, onDone]);
  return null;
}

/** Si el contexto WebGL no se puede crear (API presente pero GPU bloqueada), queda la versión estática. */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useUI.getState().setTier('static');
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Con frameloop "demand" (movimiento reducido) hace falta pedir el primer cuadro después del warmup. */
function FirstFrame() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [invalidate]);
  return null;
}

// `?gris`: la escena gris de la fase 5, para ajustar tiempos y encuadres sin el arte.
const GRAY = new URLSearchParams(location.search).has('gris');

export default function Experience() {
  return (
    <ErrorBoundary>
      <Stage />
    </ErrorBoundary>
  );
}

function Stage() {
  const tier = useUI((s) => s.tier);
  const setTier = useUI((s) => s.setTier);
  const fontsReady = useFontsReady();
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; // este módulo solo corre en el cliente
  return (
    <div className="stage" aria-hidden="true">
      {fontsReady && (
        <Canvas
          dpr={tier === 'high' ? [1, 2] : 1}
          frameloop={!warm ? 'never' : reduce ? 'demand' : 'always'}
          camera={{ fov: 50, near: 0.02, far: 40, position: [0, 2, 5] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = LIGHT.exposure; // la exposición del juego
            // ?debug: el renderer queda a mano para medir draw calls y triángulos (scripts/capture.mjs).
            if (useUI.getState().debug) Object.assign(window, { __gl: gl, __cast: castStats });
          }}
        >
          {/* Si los cuadros por segundo caen, nivel bajo (resolución 1 y un redibujo por cuadro); si se
              recuperan, vuelve. Después de 3 idas y vueltas se queda en el bajo. */}
          <PerformanceMonitor
            onDecline={() => setTier('low')}
            onIncline={() => setTier('high')}
            flipflops={3}
            onFallback={() => setTier('low')}
          />
          {GRAY ? <GrayBar /> : <World />}
          <CameraRig />
          <FrameBridge />
          <StageReady />
          {warm ? <FirstFrame /> : <Warmup onDone={onWarm} />}
        </Canvas>
      )}
    </div>
  );
}
