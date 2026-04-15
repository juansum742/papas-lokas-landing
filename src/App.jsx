import { useEffect, useRef, useState } from "react";
import logo from "../assets/Logo.jpeg";
import flyer from "../assets/Imagen de referencia que tambien contiene los horarios.jpeg";

const menuDrops = [
  {
    code: "Drop 01",
    tag: "Cheddar riot",
    title: "Cheddar Criminal",
    description:
      "Papas bien doradas, cheddar pesado y un remate crocante para que la primer mirada ya venda.",
    hook: "Golpe directo",
    accent: "Cremoso, salado, descarado",
    visualClass: "visual-cheddar"
  },
  {
    code: "Drop 02",
    tag: "Night heat",
    title: "Fuego de Medianoche",
    description:
      "Picante rojo, brillo callejero y una presencia que se siente mas promo viral que foto de menu.",
    hook: "Sube la noche",
    accent: "Picante, brillante, rapido",
    visualClass: "visual-spicy"
  },
  {
    code: "Drop 03",
    tag: "Crunch mode",
    title: "Bacon Knockout",
    description:
      "Volumen, textura y una silueta exagerada para que Papas Lokas tenga un producto iconico propio.",
    hook: "Ruido rico",
    accent: "Crunch, bacon, cierre brutal",
    visualClass: "visual-crunch"
  }
];

const manifestoStrips = [
  {
    label: "Actitud",
    title: "No hacemos comida muda.",
    text: "Cada bloque empuja la marca como si fuera un afiche pegado a las tres de la manana."
  },
  {
    label: "Ritmo",
    title: "Rapido para pedir. Pesado para recordar.",
    text: "Jerarquia dura, CTA visibles y scroll con energia, sin convertir la pagina en un circo."
  },
  {
    label: "Hambre",
    title: "Todo tiene que abrir apetito.",
    text: "Color, copy, volumen y sombras pensados para que el antojo aparezca antes de llegar al menu."
  }
];

const tickerWords = [
  "delirante sabor",
  "street food after dark",
  "papas con ruido",
  "dom a dom",
  "itzuaingo 230",
  "pedi por whatsapp"
];

const loadExternalResource = (tagName, attributes) =>
  new Promise((resolve, reject) => {
    const element = document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    element.addEventListener("load", resolve, { once: true });
    element.addEventListener("error", reject, { once: true });
    document.head.append(element);
  });

const geocodeLocation = async (token) => {
  const query = encodeURIComponent("Ituzaingo 230, Tacuarembo, Uruguay");
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1&language=es`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("No se pudo geocodificar la direccion.");
  }

  const data = await response.json();
  return data.features?.[0]?.center ?? [-55.9775, -31.7247];
};

const addDepthBuildings = (map) => {
  const labelLayer = map
    .getStyle()
    .layers?.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

  if (!map.getSource("composite")) return;

  map.addLayer(
    {
      id: "papas-lokas-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#20120c",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.8
      }
    },
    labelLayer
  );
};

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapMode, setMapMode] = useState("Ruta demo premium");
  const sliderTrackRef = useRef(null);
  const heroBoardRef = useRef(null);
  const mapRef = useRef(null);
  const mapStageRef = useRef(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  const scrollCardWithinTrack = (track, card) => {
    if (!track || !card) return;

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const targetLeft = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;

    track.scrollTo({
      left: Math.min(Math.max(targetLeft, 0), maxScrollLeft),
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  };

  const focusCard = (index) => {
    const track = sliderTrackRef.current;
    if (!track) return;

    const cards = [...track.querySelectorAll("[data-card]")];
    const nextIndex = (index + menuDrops.length) % menuDrops.length;
    setActiveIndex(nextIndex);
    scrollCardWithinTrack(track, cards[nextIndex]);
  };

  useEffect(() => {
    const revealElements = [...document.querySelectorAll("[data-reveal]")];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty("--scroll-progress", "0");
      return undefined;
    }

    const syncScrollDepth = () => {
      document.documentElement.style.setProperty(
        "--scroll-progress",
        Math.min(window.scrollY / 140, 10).toFixed(2)
      );
    };

    let frame = null;

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        syncScrollDepth();
        frame = null;
      });
    };

    syncScrollDepth();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const board = heroBoardRef.current;
    if (!board || prefersReducedMotion || !hasFinePointer) return undefined;

    const handleMove = (event) => {
      const rect = board.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      board.style.setProperty("--tilt-x", `${(y * -6).toFixed(2)}deg`);
      board.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
    };

    const handleLeave = () => {
      board.style.setProperty("--tilt-x", "0deg");
      board.style.setProperty("--tilt-y", "0deg");
    };

    board.addEventListener("pointermove", handleMove);
    board.addEventListener("pointerleave", handleLeave);

    return () => {
      board.removeEventListener("pointermove", handleMove);
      board.removeEventListener("pointerleave", handleLeave);
    };
  }, [hasFinePointer, prefersReducedMotion]);

  useEffect(() => {
    const track = sliderTrackRef.current;
    if (!track) return undefined;

    const findClosestCard = () => {
      const cards = [...track.querySelectorAll("[data-card]")];
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let distance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const nextDistance = Math.abs(center - (rect.left + rect.width / 2));

        if (nextDistance < distance) {
          closest = index;
          distance = nextDistance;
        }
      });

      setActiveIndex(closest);
    };

    let scrollTimer = null;

    const handleScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(findClosestCard, 80);
    };

    track.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimer);
    };
  }, []);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapContainer = mapRef.current;
    const mapStage = mapStageRef.current;

    if (!token || !mapContainer || !mapStage) {
      setMapMode("Ruta demo premium");
      return undefined;
    }

    let cancelled = false;
    let mapInstance = null;

    const initMap = async () => {
      try {
        setMapMode("Cargando mapa real");

        await Promise.all([
          loadExternalResource("link", {
            rel: "stylesheet",
            href: "https://api.mapbox.com/mapbox-gl-js/v3.6.2/mapbox-gl.css"
          }),
          loadExternalResource("script", {
            src: "https://api.mapbox.com/mapbox-gl-js/v3.6.2/mapbox-gl.js"
          })
        ]);

        if (cancelled) return;

        const { mapboxgl } = window;
        mapboxgl.accessToken = token;

        const center = await geocodeLocation(token);
        if (cancelled) return;

        mapInstance = new mapboxgl.Map({
          container: mapContainer,
          style: "mapbox://styles/mapbox/dark-v11",
          center,
          zoom: 15.7,
          pitch: 60,
          bearing: -20,
          antialias: false,
          interactive: window.innerWidth > 768
        });

        mapInstance.scrollZoom.disable();

        mapInstance.on("load", () => {
          if (cancelled) return;

          addDepthBuildings(mapInstance);

          const markerElement = document.createElement("div");
          markerElement.className = "route-pin-live";
          markerElement.innerHTML = `<img src="${logo}" alt="Papas Lokas">`;

          new mapboxgl.Marker({ element: markerElement, anchor: "bottom" })
            .setLngLat(center)
            .addTo(mapInstance);

          mapInstance.easeTo({
            center,
            zoom: 16.1,
            pitch: 64,
            bearing: -26,
            duration: prefersReducedMotion ? 0 : 2000
          });

          mapStage.classList.add("is-interactive");
          setMapMode("Mapa nocturno activo");
        });
      } catch (error) {
        console.error(error);
        setMapMode("Ruta demo premium");
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div className="riot-page">
      <div className="page-noise" aria-hidden="true"></div>
      <div className="ambient ambient-a" aria-hidden="true"></div>
      <div className="ambient ambient-b" aria-hidden="true"></div>

      <main>
        <section className="hero-poster section-shell" id="top">
          <div className="hero-board" ref={heroBoardRef} data-reveal="fade">
            <header className="hero-topbar">
              <a className="header-brand" href="#top">
                <img src={logo} alt="Logo Papas Lokas" />
                <div>
                  <span>Poster Riot route</span>
                  <strong>Papas Lokas</strong>
                </div>
              </a>

              <div className="hero-topbar-side">
                <span className="hero-topbar-note">Delirante sabor</span>
                <nav className="header-nav" aria-label="Secciones">
                  <a href="#menu">Menu</a>
                  <a href="#horarios">Horarios</a>
                  <a href="#mapa">Ubicacion</a>
                </nav>
              </div>
            </header>

            <div className="hero-marquee" aria-hidden="true">
              <div className="ticker-track hero-marquee-track">
                {[...tickerWords, ...tickerWords].map((word, index) => (
                  <span key={`hero-${word}-${index}`}>{word}</span>
                ))}
              </div>
            </div>

            <div className="hero-stage">
              <div className="hero-copyblock">
                <span className="route-chip">Creative route selected: Poster Riot</span>
                <h1 className="hero-title">
                  <span className="hero-title-tag">Las</span>
                  <span className="hero-title-main hero-title-main-a">Papas</span>
                  <span className="hero-title-main hero-title-main-b">Mas Lokas</span>
                  <span className="hero-title-city">de Tacuarembo</span>
                </h1>
                <p className="hero-description">
                  Una landing tratada como campana callejera: afiches rotos, ritmo visual
                  duro, hambre instantanea y una vibra nocturna que no se parece a tus otras
                  paginas.
                </p>
              </div>

              <div className="hero-collage">
                <article
                  className="paper-card flyer-card parallax-piece"
                  style={{ "--angle": "-7deg", "--speed": 0.1 }}
                >
                  <div className="paper-tape paper-tape-a"></div>
                  <img src={flyer} alt="Flyer Papas Lokas" />
                </article>

                <article
                  className="paper-card hours-card parallax-piece"
                  style={{ "--angle": "5deg", "--speed": 0.06 }}
                >
                  <span className="card-kicker">Dom a dom</span>
                  <strong>10:00 a 15:00</strong>
                  <strong>18:00 a 00:30</strong>
                  <p>Golpe de dia. Golpe de noche.</p>
                </article>

                <div
                  className="fries-object parallax-piece"
                  style={{ "--angle": "-4deg", "--speed": 0.12 }}
                  aria-hidden="true"
                >
                  <span className="fry fry-a"></span>
                  <span className="fry fry-b"></span>
                  <span className="fry fry-c"></span>
                  <span className="fry fry-d"></span>
                  <span className="box-back"></span>
                  <span className="box-front"></span>
                  <span className="box-shadow"></span>
                </div>

                <article
                  className="paper-card location-card parallax-piece"
                  style={{ "--angle": "2deg", "--speed": 0.08 }}
                >
                  <span className="card-kicker">Ruta real</span>
                  <strong>Ituzaingo 230</strong>
                  <p>Abri el mapa. Caele al local. Salis con la noche acomodada.</p>
                </article>

                <div className="hero-actions">
                  <a className="ticket-button ticket-primary" href="#menu">
                    Ver menu
                  </a>
                  <a
                    className="ticket-button ticket-secondary"
                    href="https://wa.me/59895165851?text=Hola%20Papas%20Lokas%2C%20quiero%20hacer%20un%20pedido"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pedir por WhatsApp
                  </a>
                </div>

                <div className="hero-logo-sticker">
                  <img src={logo} alt="Papas Lokas" />
                </div>
              </div>

              <div className="hero-belt" aria-hidden="true">
                <span>PAPAS LOKAS</span>
                <span>STREET FOOD AFTER DARK</span>
                <span>PAPAS LOKAS</span>
                <span>STREET FOOD AFTER DARK</span>
              </div>
            </div>
          </div>
        </section>

        <section className="menu-drop section-shell" id="menu">
          <div className="section-head" data-reveal="up">
            <div>
              <span className="section-tag">Menu riot</span>
              <h2>Los drops que hacen ruido antes del primer bocado.</h2>
            </div>

            <div className="rail-controls">
              <button type="button" onClick={() => focusCard(activeIndex - 1)}>
                &#8592;
              </button>
              <button type="button" onClick={() => focusCard(activeIndex + 1)}>
                &#8594;
              </button>
            </div>
          </div>

          <div className="menu-rail" ref={sliderTrackRef}>
            {menuDrops.map((drop, index) => {
              const previousIndex = (activeIndex - 1 + menuDrops.length) % menuDrops.length;
              const nextIndex = (activeIndex + 1) % menuDrops.length;
              const className = [
                "menu-poster",
                activeIndex === index ? "is-active" : "",
                previousIndex === index ? "is-prev" : "",
                nextIndex === index ? "is-next" : ""
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <article className={className} key={drop.code} data-card>
                  <div className="poster-topline">
                    <span>{drop.tag}</span>
                    <span>{drop.code}</span>
                  </div>

                  <div className={`poster-visual ${drop.visualClass}`} aria-hidden="true">
                    <span className="tray"></span>
                    <span className="pile pile-a"></span>
                    <span className="pile pile-b"></span>
                    <span className="sauce sauce-a"></span>
                    <span className="sauce sauce-b"></span>
                    <span className="crumb crumb-a"></span>
                    <span className="crumb crumb-b"></span>
                  </div>

                  <div className="poster-copy">
                    <h3>{drop.title}</h3>
                    <p>{drop.description}</p>
                    <div className="poster-mood">
                      <span>{drop.hook}</span>
                      <strong>{drop.accent}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="hours-bomb section-shell" id="horarios">
          <div className="hours-layout" data-reveal="up">
            <div className="hours-copy">
              <span className="section-tag">Open ritual</span>
              <h2>Dos tandas. Cero vueltas. Hambre atendida.</h2>
              <p>
                La info importante no cae como tabla gris. Explota como pieza de campana:
                visible, rapida y con tono de marca.
              </p>
            </div>

            <div className="hours-impact">
              <div className="hours-burst">HORARIOS</div>
              <div className="hours-window">
                <span>Domingo a domingo</span>
                <strong>10:00 a 15:00</strong>
                <strong>18:00 a 00:30</strong>
              </div>
              <div className="hours-note">Pega de dia. Pega de noche.</div>
            </div>
          </div>
        </section>

        <section className="route-poster section-shell" id="mapa">
          <div className="section-head compact" data-reveal="up">
            <div>
              <span className="section-tag">Night route</span>
              <h2>Ubicacion real, pero metida en la historia visual.</h2>
            </div>
          </div>

          <div className="route-board" data-reveal="fade">
            <div className="route-copy">
              <span className="route-mode">{mapMode}</span>
              <h3>Ituzaingo 230</h3>
              <p>
                El mapa arranca como pieza editorial con profundidad propia y se vuelve
                interactivo cuando hay token de Mapbox.
              </p>
              <div className="route-actions">
                <a
                  className="ticket-button ticket-primary"
                  href="https://www.google.com/maps/search/?api=1&query=Ituzaingo+230+Tacuarembo+Uruguay"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir Google Maps
                </a>
                <a className="ticket-button ticket-secondary" href="tel:+59846321572">
                  Llamar ahora
                </a>
              </div>
            </div>

            <div className="route-stage" ref={mapStageRef}>
              <div className="route-grid" aria-hidden="true"></div>
              <div className="route-orbit orbit-a" aria-hidden="true"></div>
              <div className="route-orbit orbit-b" aria-hidden="true"></div>
              <div className="route-pin" aria-hidden="true">
                <img src={logo} alt="Papas Lokas" />
              </div>
              <div ref={mapRef} className="route-canvas" aria-label="Mapa Papas Lokas"></div>
            </div>
          </div>
        </section>

        <section className="brand-wall section-shell">
          <div className="section-head compact" data-reveal="up">
            <div>
              <span className="section-tag">Brand code</span>
              <h2>Marca callejera, antojable y con dientes.</h2>
            </div>
          </div>

          <div className="manifesto-wall">
            {manifestoStrips.map((item, index) => (
              <article
                className="manifesto-strip"
                key={item.label}
                data-reveal="up"
                style={{ "--strip-angle": `${index % 2 === 0 ? -2 : 2}deg` }}
              >
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-riot section-shell">
          <div className="cta-board" data-reveal="up">
            <span className="section-tag">Ultimo llamado</span>
            <h2>Si ya te dio hambre, no lo pienses como brochure. Pedilo.</h2>
            <p>
              Esta demo esta hecha para empujar conversion, no para quedarse linda y muda.
            </p>
            <div className="cta-actions">
              <a
                className="ticket-button ticket-primary"
                href="https://wa.me/59895165851?text=Hola%20Papas%20Lokas%2C%20quiero%20pedir%20las%20papas%20mas%20locas"
                target="_blank"
                rel="noreferrer"
              >
                Pedir por WhatsApp
              </a>
              <a className="ticket-button ticket-secondary" href="#mapa">
                Ver ubicacion
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="riot-footer section-shell">
        <div className="footer-brand">
          <img src={logo} alt="Papas Lokas" />
          <div>
            <strong>Papas Lokas</strong>
            <span>Street food con ruido visual de madrugada</span>
          </div>
        </div>

        <div className="footer-links">
          <a href="https://www.instagram.com/papaslokastbo/" target="_blank" rel="noreferrer">
            @papaslokastbo
          </a>
          <a href="tel:+59895165851">095 165 851</a>
          <a href="tel:+59846321572">4632 1572</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
