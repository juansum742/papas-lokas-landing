import { useEffect, useRef, useState } from "react";
import logo from "../assets/Logo.jpeg";
import flyer from "../assets/Imagen de referencia que tambien contiene los horarios.jpeg";

const products = [
  {
    tag: "Top seller",
    title: "Cheddar Explosion",
    description:
      "Papas doradas, cheddar brutal y un remate de bacon para generar deseo en una sola mirada.",
    visualClass: "visual-cheddar"
  },
  {
    tag: "Street heat",
    title: "La Lokura Picante",
    description:
      "Contraste rojo, especias arriba y una vibra nocturna que conecta con el tono urbano de la marca.",
    visualClass: "visual-spicy"
  },
  {
    tag: "Textura total",
    title: "Bacon Crunch XL",
    description:
      "Pensada como hero secundaria del menu: crujido, brillo, volumen y un look premium para slider 3D.",
    visualClass: "visual-crunch"
  }
];

const experiences = [
  {
    step: "01",
    title: "Impacto instantaneo",
    description:
      "Hero con capas, glow y profundidad para que la marca entre con fuerza sin perder claridad comercial."
  },
  {
    step: "02",
    title: "Lectura rapida",
    description:
      "CTA visibles, horarios grandes y una jerarquia limpia para mobile Android y pantallas angostas."
  },
  {
    step: "03",
    title: "Branding con actitud",
    description:
      "Rojo profundo, dorado intenso y un tono callejero premium inspirado directo en el logo y el flyer."
  }
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
      id: "papas-lokas-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#44221a",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.74
      }
    },
    labelLayer
  );
};

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapMode, setMapMode] = useState("Vista demo premium");
  const sliderTrackRef = useRef(null);
  const heroSceneRef = useRef(null);
  const mapRef = useRef(null);
  const mapStageRef = useRef(null);
  const autoAdvanceRef = useRef(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  const focusCard = (index) => {
    const track = sliderTrackRef.current;
    if (!track) return;

    const cards = [...track.querySelectorAll("[data-card]")];
    const nextIndex = (index + products.length) % products.length;
    setActiveIndex(nextIndex);

    cards[nextIndex]?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center"
    });
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
      { threshold: 0.18 }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncScrollDepth = () => {
      document.documentElement.style.setProperty(
        "--scroll-progress",
        (window.scrollY / 100).toFixed(2)
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
  }, []);

  useEffect(() => {
    const scene = heroSceneRef.current;
    if (!scene || prefersReducedMotion || !hasFinePointer) return undefined;

    const handleMove = (event) => {
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      scene.style.setProperty("--tilt-x", `${(y * -9).toFixed(2)}deg`);
      scene.style.setProperty("--tilt-y", `${(x * 11).toFixed(2)}deg`);
    };

    const handleLeave = () => {
      scene.style.setProperty("--tilt-x", "0deg");
      scene.style.setProperty("--tilt-y", "0deg");
    };

    scene.addEventListener("pointermove", handleMove);
    scene.addEventListener("pointerleave", handleLeave);

    return () => {
      scene.removeEventListener("pointermove", handleMove);
      scene.removeEventListener("pointerleave", handleLeave);
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
        const cardCenter = rect.left + rect.width / 2;
        const nextDistance = Math.abs(center - cardCenter);

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
      scrollTimer = window.setTimeout(findClosestCard, 70);
    };

    track.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimer);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !hasFinePointer) return undefined;

    window.clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = window.setInterval(() => {
      focusCard(activeIndex + 1);
    }, 4300);

    return () => window.clearInterval(autoAdvanceRef.current);
  }, [activeIndex, hasFinePointer, prefersReducedMotion]);

  useEffect(() => {
    const track = sliderTrackRef.current;
    if (!track || prefersReducedMotion || !hasFinePointer) return undefined;

    const stopAutoAdvance = () => window.clearInterval(autoAdvanceRef.current);
    const startAutoAdvance = () => {
      window.clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = window.setInterval(() => {
        focusCard(activeIndex + 1);
      }, 4300);
    };

    track.addEventListener("pointerenter", stopAutoAdvance);
    track.addEventListener("pointerleave", startAutoAdvance);

    return () => {
      track.removeEventListener("pointerenter", stopAutoAdvance);
      track.removeEventListener("pointerleave", startAutoAdvance);
    };
  }, [activeIndex, hasFinePointer, prefersReducedMotion]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapContainer = mapRef.current;
    const mapStage = mapStageRef.current;

    if (!token || !mapContainer || !mapStage) {
      setMapMode("Vista demo premium");
      return undefined;
    }

    let cancelled = false;
    let mapInstance = null;

    const initMap = async () => {
      try {
        setMapMode("Cargando mapa interactivo");

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
          zoom: 15.9,
          pitch: 58,
          bearing: -18,
          antialias: false,
          interactive: window.innerWidth > 768
        });

        mapInstance.scrollZoom.disable();

        mapInstance.on("load", () => {
          if (cancelled) return;

          addDepthBuildings(mapInstance);

          const markerElement = document.createElement("div");
          markerElement.className = "map-pin-live";
          markerElement.innerHTML = `<img src="${logo}" alt="Marca Papas Lokas">`;

          new mapboxgl.Marker({ element: markerElement, anchor: "bottom" })
            .setLngLat(center)
            .addTo(mapInstance);

          mapInstance.easeTo({
            center,
            zoom: 16.2,
            pitch: 64,
            bearing: -24,
            duration: prefersReducedMotion ? 0 : 2200
          });

          mapStage.classList.add("is-interactive");
          setMapMode("Mapa interactivo activo");
        });
      } catch (error) {
        console.error(error);
        setMapMode("Vista demo premium");
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [logo, prefersReducedMotion]);

  return (
    <div className="page-shell">
      <div className="ambient ambient-a" aria-hidden="true"></div>
      <div className="ambient ambient-b" aria-hidden="true"></div>
      <div className="ambient ambient-c" aria-hidden="true"></div>

      <header className="site-header section-shell">
        <a className="brand-lockup" href="#top" aria-label="Volver al inicio">
          <img src={logo} alt="Logo Papas Lokas" className="brand-logo" />
          <div className="brand-copy">
            <span className="brand-kicker">Street food premium</span>
            <strong>Papas Lokas</strong>
          </div>
        </a>

        <nav className="top-nav" aria-label="Secciones principales">
          <a href="#menu">Menu</a>
          <a href="#horarios">Horarios</a>
          <a href="#mapa">Ubicacion</a>
        </nav>
      </header>

      <main>
        <section className="hero section-shell" id="top">
          <div className="hero-copy" data-reveal="up">
            <span className="eyebrow">Delirante sabor. Energia urbana.</span>
            <h1>
              Las papas mas <span>locas</span> de Tacuarembo
            </h1>
            <p className="hero-description">
              Una demo pensada para vender con impacto real: color nocturno, profundidad,
              motion suave y una identidad que mezcla calle, brillo premium y hambre
              inmediata.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#menu">
                Ver menu
              </a>
              <a
                className="button button-secondary"
                href="https://wa.me/59895165851?text=Hola%20Papas%20Lokas%2C%20quiero%20hacer%20un%20pedido"
                target="_blank"
                rel="noreferrer"
              >
                Pedir por WhatsApp
              </a>
            </div>

            <div className="hero-meta">
              <article className="meta-card">
                <span className="meta-label">Horario activo</span>
                <strong>Domingo a domingo</strong>
                <p>10:00 a 15:00 y 18:00 a 00:30</p>
              </article>
              <article className="meta-card">
                <span className="meta-label">Pickup + delivery</span>
                <strong>Ituzaingo 230</strong>
                <p>Salida rapida, look premium, CTA directo.</p>
              </article>
            </div>
          </div>

          <div className="hero-scene" data-tilt data-reveal="fade" ref={heroSceneRef}>
            <div className="scene-light" aria-hidden="true"></div>
            <div className="scene-ring parallax-layer" style={{ "--speed": 0.07 }} aria-hidden="true"></div>
            <div className="scene-grid" aria-hidden="true"></div>

            <div className="scene-logo-orb parallax-layer" style={{ "--speed": 0.1 }}>
              <img src={logo} alt="Logo Papas Lokas" />
            </div>

            <figure className="scene-poster parallax-layer" style={{ "--speed": 0.16 }}>
              <img src={flyer} alt="Flyer de referencia con horarios Papas Lokas" loading="eager" />
            </figure>

            <article className="scene-card scene-card-main parallax-layer" style={{ "--speed": 0.11 }}>
              <span className="scene-kicker">Impacto visual que vende</span>
              <h2>Profundidad, brillo y antojo desde el primer scroll.</h2>
              <p>
                Capas flotantes, contraste extremo y una composicion hecha para que el
                logo y los CTA respiren con fuerza.
              </p>
            </article>

            <article className="scene-card scene-card-mini parallax-layer" style={{ "--speed": 0.2 }}>
              <span className="scene-chip">Hoy</span>
              <strong>Open kitchen mode</strong>
              <p>Branding visible, horarios claros y ubicacion a un toque.</p>
            </article>

            <div className="scene-badge parallax-layer" style={{ "--speed": 0.22 }}>
              Delirante sabor
            </div>
          </div>
        </section>

        <section className="products section-shell" id="menu">
          <div className="section-heading" data-reveal="up">
            <div>
              <span className="eyebrow">Productos destacados</span>
              <h2>Bombas de sabor con presencia propia.</h2>
            </div>

            <div className="slider-controls">
              <button className="slider-button" type="button" aria-label="Anterior" onClick={() => focusCard(activeIndex - 1)}>
                &#8592;
              </button>
              <button className="slider-button" type="button" aria-label="Siguiente" onClick={() => focusCard(activeIndex + 1)}>
                &#8594;
              </button>
            </div>
          </div>

          <div className="product-slider">
            <div className="product-track" id="productTrack" ref={sliderTrackRef}>
              {products.map((product, index) => {
                const previousIndex = (activeIndex - 1 + products.length) % products.length;
                const nextIndex = (activeIndex + 1) % products.length;
                const cardClassName = [
                  "product-card",
                  activeIndex === index ? "is-active" : "",
                  previousIndex === index ? "is-prev" : "",
                  nextIndex === index ? "is-next" : ""
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <article className={cardClassName} data-card key={product.title}>
                    <div className={`product-visual ${product.visualClass}`} aria-hidden="true">
                      <span className="plate"></span>
                      <span className="fries fries-a"></span>
                      <span className="fries fries-b"></span>
                      <span className="sauce sauce-a"></span>
                      <span className="sauce sauce-b"></span>
                    </div>
                    <div className="product-copy">
                      <span className="product-tag">{product.tag}</span>
                      <h3>{product.title}</h3>
                      <p>{product.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="schedule section-shell" id="horarios">
          <div className="schedule-panel" data-reveal="up">
            <div className="schedule-copy">
              <span className="eyebrow">Bloque destacado</span>
              <h2>Horarios pensados para el hambre real.</h2>
              <p>
                El estilo del flyer vive aca con un panel fuerte, limpio y facil de leer
                incluso en mobile.
              </p>
            </div>

            <div className="schedule-board">
              <div className="schedule-title">
                <span>Actualizamos nuestros</span>
                <strong>HORARIOS</strong>
              </div>
              <div className="schedule-strip">
                <strong>Domingo a Domingo</strong>
                <div>
                  <span>10:00 a 15:00</span>
                  <span>18:00 a 00:30</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="experience section-shell">
          <div className="section-heading compact" data-reveal="up">
            <div>
              <span className="eyebrow">Experiencia</span>
              <h2>No es solo comida. Es energia Papas Lokas.</h2>
            </div>
          </div>

          <div className="experience-grid">
            {experiences.map((item) => (
              <article className="experience-card" data-reveal="up" key={item.step}>
                <span className="card-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="map-section section-shell" id="mapa">
          <div className="section-heading compact" data-reveal="up">
            <div>
              <span className="eyebrow">Mapa premium</span>
              <h2>Ubicacion integrada a la experiencia visual.</h2>
            </div>
          </div>

          <div className="map-shell" data-reveal="fade">
            <div className="map-overlay">
              <span className="map-mode">{mapMode}</span>
              <h3>Ituzaingo 230</h3>
              <p>
                El bloque arranca con una escena custom estilizada y se actualiza a mapa
                interactivo oscuro si agregas un token publico de Mapbox.
              </p>
              <div className="map-actions">
                <a
                  className="button button-primary"
                  href="https://www.google.com/maps/search/?api=1&query=Ituzaingo+230+Tacuarembo+Uruguay"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en Google Maps
                </a>
                <a className="button button-secondary" href="tel:+59846321572">
                  Llamar ahora
                </a>
              </div>
            </div>

            <div className="map-stage" ref={mapStageRef}>
              <div className="map-grid-lines" aria-hidden="true"></div>
              <div className="map-route route-a" aria-hidden="true"></div>
              <div className="map-route route-b" aria-hidden="true"></div>
              <div className="map-pin" aria-hidden="true">
                <img src={logo} alt="Marca Papas Lokas" />
              </div>
              <div ref={mapRef} className="map-canvas" aria-label="Mapa de ubicacion Papas Lokas"></div>
            </div>
          </div>
        </section>

        <section className="cta-section section-shell">
          <div className="cta-panel" data-reveal="up">
            <div>
              <span className="eyebrow">CTA final</span>
              <h2>Hacelo simple: ver, antojarse y pedir.</h2>
              <p>
                La pagina queda lista para vender desde mobile con botones grandes, ritmo
                visual y salida rapida a WhatsApp.
              </p>
            </div>
            <a
              className="button button-primary large"
              href="https://wa.me/59895165851?text=Hola%20Papas%20Lokas%2C%20quiero%20pedir%20las%20papas%20mas%20locas"
              target="_blank"
              rel="noreferrer"
            >
              Pedir por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <div className="footer-brand">
          <img src={logo} alt="Logo Papas Lokas" />
          <div>
            <strong>Papas Lokas</strong>
            <span>Street food premium en Tacuarembo</span>
          </div>
        </div>

        <div className="footer-links">
          <a href="https://www.instagram.com/papaslokastbo/" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="tel:+59895165851">095 165 851</a>
          <a href="tel:+59846321572">4632 1572</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
