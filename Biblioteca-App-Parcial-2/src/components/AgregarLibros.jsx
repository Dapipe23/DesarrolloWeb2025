import { useEffect, useRef, useState } from "react";

const AgregarLibros = ({ onAgregar, onCerrar }) => {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [año, setAnio] = useState("");
  const [ediciones, setEdiciones] = useState("");
  const [portada, setPortada] = useState("");

  const [sugerencias, setSugerencias] = useState([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [errorSugerencias, setErrorSugerencias] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!titulo || titulo.trim().length < 3) {
      setSugerencias([]);
      setLoadingSugerencias(false);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    setLoadingSugerencias(true);
    setErrorSugerencias(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      try {
        const q = encodeURIComponent(titulo.trim());
        const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=6`, { signal: abortRef.current.signal });
        const data = await res.json();
        const docs = data.docs || [];
        const items = docs.map((d) => ({
          titulo: d.title,
          autor: d.author_name ? d.author_name[0] : "Desconocido",
          anio: d.first_publish_year || "",
          ediciones: d.edition_count || "",
          portada: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "",
          key: d.key || `${d.title}-${d.first_publish_year || ""}`,
        }));
        setSugerencias(items);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error cargar sugerencias', err);
        setErrorSugerencias('No se pudieron cargar sugerencias');
        setSugerencias([]);
      } finally {
        setLoadingSugerencias(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [titulo]);

  const handleSelect = (s) => {
    setTitulo(s.titulo || "");
    setAutor(s.autor || "");
    setAnio(s.anio ? String(s.anio) : "");
    setEdiciones(s.ediciones ? String(s.ediciones) : "");
    setPortada(s.portada || "");
    setSugerencias([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim() || !año.toString().trim() || !ediciones.toString().trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    let portadaFinal = portada;
    if (!portadaFinal) {
      try {
        const q = encodeURIComponent(titulo.trim());
        const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1`);
        const data = await res.json();
        const d = (data.docs && data.docs[0]) || null;
        if (d && d.cover_i) {
          portadaFinal = `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`;
        }
      } catch (err) {
        console.warn('No se pudo obtener portada automáticamente', err);
      }
    }

    if (portadaFinal && /^https?:\/\//i.test(portadaFinal) && !portadaFinal.startsWith('data:')) {
      try {
        const imgRes = await fetch(portadaFinal);
        const blob = await imgRes.blob();
        const MAX_BYTES = 300 * 1024;
        if (blob.size <= MAX_BYTES) {
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onerror = reject;
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          portadaFinal = dataUrl;
        } else {
          console.warn('Imagen demasiado grande para guardar en localStorage; se conservará la URL externa.');
        }
      } catch (err) {
        console.warn('No se pudo descargar/convertir la imagen:', err);
      }
    }

    onAgregar({ titulo, autor, anio: año, ediciones, portada: portadaFinal });
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Agregar Libro Manualmente</h3>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              aria-label="Título del libro"
            />

            {loadingSugerencias && <div className="sugerencias-loading">Buscando...</div>}

            {sugerencias && sugerencias.length > 0 && (
              <ul className="sugerencias-list" role="listbox">
                {sugerencias.map((s) => (
                  <li
                    key={s.key}
                    role="option"
                    tabIndex={0}
                    onClick={() => handleSelect(s)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(s); }}
                  >
                    <strong>{s.titulo}</strong>
                    <div className="sugerencia-meta">{s.autor} • {s.anio || 'N/A'}</div>
                  </li>
                ))}
              </ul>
            )}

            {errorSugerencias && <div className="sugerencias-error">{errorSugerencias}</div>}
          </div>

          <input
            type="text"
            placeholder="Autor"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            aria-label="Autor del libro"
          />
          <input
            type="number"
            placeholder="Año"
            value={año}
            onChange={(e) => setAnio(e.target.value)}
            aria-label="Año de publicación"
          />
            <input
            type="text"
            placeholder="ediciones"
            value={ediciones}
            onChange={(e) => setEdiciones(e.target.value)}
            aria-label="Número de ediciones"
          />
          <input
            type="text"
            placeholder="URL de portada (opcional)"
            value={portada}
            onChange={(e) => setPortada(e.target.value)}
            aria-label="URL de la portada"
          />
          <div className="botones-modal">
            <button type="submit">Agregar</button>
            <button type="button" className="btn-cancelar" onClick={onCerrar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarLibros;
