import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useMemo } from 'react';
import { PerspectiveCamera, Vector2, Vector3 } from 'three';
import { rig } from '../scroll/rig';

const SMOOTH = 0.35; // el único suavizado de la cámara (el scroll va con scrub: true)

/**
 * Lleva la cámara a `rig.cam`: posición, objetivo, campo y encuadre. El encuadre corre el centro óptico
 * (setViewOffset) para que lo que se mira caiga fuera del texto sin girar la cámara.
 * Con un mouse, un parallax sutil y proporcional a la distancia: de cerca se mueve menos.
 */
export function CameraRig() {
  const v = useMemo(
    () => ({
      goal: new Vector3(),
      target: new Vector3(),
      look: new Vector3(),
      lens: new Vector3(), // fov, ox, oy
      lensGoal: new Vector3(),
      fwd: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      pointer: new Vector2(),
      started: false,
    }),
    [],
  );

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      v.pointer.set((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2);
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [v]);

  useFrame((state, delta) => {
    const c = rig.cam;
    const cam = state.camera as PerspectiveCamera;
    v.goal.set(c.px, c.py, c.pz);
    v.target.set(c.tx, c.ty, c.tz);
    v.lensGoal.set(c.fov, c.ox, c.oy);

    if (rig.snap || !v.started) {
      cam.position.copy(v.goal);
      v.look.copy(v.target);
      v.lens.copy(v.lensGoal);
      v.started = true;
    } else {
      const d = v.goal.distanceTo(v.target);
      v.fwd.subVectors(v.target, v.goal).normalize();
      v.right.crossVectors(v.fwd, cam.up).normalize();
      v.up.crossVectors(v.right, v.fwd);
      v.goal.addScaledVector(v.right, v.pointer.x * 0.035 * d).addScaledVector(v.up, v.pointer.y * 0.02 * d);
      easing.damp3(cam.position, v.goal, SMOOTH, delta);
      easing.damp3(v.look, v.target, SMOOTH, delta);
      easing.damp3(v.lens, v.lensGoal, SMOOTH, delta);
    }

    cam.lookAt(v.look);
    cam.fov = v.lens.x;
    const { width: w, height: h } = state.size;
    cam.setViewOffset(w, h, -v.lens.y * w, v.lens.z * h, w, h); // también actualiza la proyección
  });

  return null;
}
