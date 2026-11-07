/** La trampa con las cartas del juego, para la versión sin 3D. */
export function TrampaCartas() {
  return (
    <div className="trampa-cartas" data-ui>
      <figure>
        <span className="carta-quemada">
          <img src="/cards/4C.webp" alt="Cuatro de copa quemado: la carta de arriba" width={120} height={185} loading="lazy" />
        </span>
        <figcaption>La de arriba: quemada.</figcaption>
      </figure>
      <figure>
        <img src="/cards/7O.webp" alt="Siete de oro: la carta de abajo, la que juega" width={120} height={185} loading="lazy" />
        <figcaption>La de abajo: la que juega.</figcaption>
      </figure>
    </div>
  );
}
