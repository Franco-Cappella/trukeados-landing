// La escena 3D: un canvas fijo detrás de todo el sitio, decorativo (aria-hidden). Se carga con lazy() desde
// App, así three no entra al paquete principal. Se comunica con la capa DOM solo a través de `rig`.
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { rig } from '../scroll/rig';
import { useUI } from '../state/store';
import { CameraRig } from './CameraRig';
import { GrayBar } from './gray/GrayBar';

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

export default function Experience() {
  const tier = useUI((s) => s.tier);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; // este módulo solo corre en el cliente
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={tier === 'high' ? [1, 2] : 1}
        frameloop={reduce ? 'demand' : 'always'}
        camera={{ fov: 50, near: 0.02, far: 40, position: [0, 2, 5] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <GrayBar />
        <CameraRig />
        <FrameBridge />
      </Canvas>
    </div>
  );
}
