import { useEffect, useState } from 'react';

/** El paño, los cuadros y los rótulos escriben con Hanken Grotesk en canvas: se espera a que la fuente esté cargada. */
export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([
      document.fonts.load("600 46px 'Hanken Grotesk Variable'"),
      document.fonts.load("700 28px 'Hanken Grotesk Variable'"),
    ]).finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
