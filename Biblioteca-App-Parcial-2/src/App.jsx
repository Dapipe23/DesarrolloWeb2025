  import { useEffect, useState } from "react";
import "./App.css";
import AgregarLibros from "./components/AgregarLibros";
import ListaLibros from "./components/ListaLibros";

const STORAGE_KEY = "favoritos_biblioteca";
const BOOKS_KEY = "libros_agregados";

const App = () => {
  const [books, setBooks] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let favs = [];
    let manualesRaw = [];
    try {
      favs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (err) {
      console.warn('No se pudo parsear favoritos desde localStorage', err);
      favs = [];
    }
    try {
      manualesRaw = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]");
    } catch (err) {
      console.warn('No se pudo parsear libros desde localStorage', err);
      manualesRaw = [];
    }
    const manuales = manualesRaw.map((m) => ({ ...m, origen: m.origen || "Manual" }));
    setFavoritos(Array.isArray(favs) ? favs : []);
    setBooks(Array.isArray(manuales) ? manuales : []);
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("https://openlibrary.org/search.json?q=programming&limit=20");
        const data = await res.json();

        const apiBooks = data.docs.map((b) => ({
          titulo: b.title,
          autor: b.author_name ? b.author_name[0] : "Desconocido",
          anio: b.first_publish_year || "N/A",
          ediciones: b.edition_count || "N/A",
          // cover_i -> portada URL usando OpenLibrary Covers API
          portada: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
          origen: "API",
        }));

        setBooks((prevBooks) => {
          const titulos = new Set(prevBooks.map((b) => b.titulo));
          const nuevos = apiBooks.filter((b) => !titulos.has(b.titulo));
          return [...prevBooks, ...nuevos];
        });

        setLoading(false);
      } catch (error) {
        console.error("Error al obtener libros:", error);
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);


  useEffect(() => {
    const manuales = books.filter((b) => b.origen === "Manual" || !b.origen);
    const manualesParaGuardar = manuales.map((m) => {
      const copy = { ...m };
      if (copy.portada && typeof copy.portada === 'string' && copy.portada.startsWith('data:')) {
        delete copy.portada;
      }
      return copy;
    });
    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(manualesParaGuardar));
    } catch (err) {
      console.warn('No se pudo guardar libros manuales en localStorage (posible cuota):', err);
    }
  }, [books]);

  const addFavorito = (libro) => {
    const { portada, ...sinPortada } = libro;
    setFavoritos((prev) => {
      if (prev.find((f) => f.titulo === sinPortada.titulo)) return prev;
      const nuevos = [...prev, sinPortada];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
      } catch (err) {
        console.warn('No se pudo guardar favoritos en localStorage, intentando versión reducida', err);
        try {
          const reducidos = nuevos.map(({ titulo, autor, anio }) => ({ titulo, autor, anio }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducidos));
          return reducidos;
        } catch (err2) {
          console.error('No se pudo guardar versión reducida de favoritos en localStorage', err2);
          return nuevos;
        }
      }
      return nuevos;
    });
  };

  const deleteFavorito = (index) => {
    setFavoritos((prev) => {
      const nuevos = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
      } catch (err) {
        console.warn('No se pudo actualizar favoritos en localStorage, intentando versión reducida', err);
        try {
          const reducidos = nuevos.map(({ titulo, autor, anio }) => ({ titulo, autor, anio }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducidos));
          return reducidos;
        } catch (err2) {
          console.error('No se pudo guardar versión reducida de favoritos en localStorage', err2);
          return nuevos;
        }
      }
      return nuevos;
    });
  };

  const addBook = (nuevoLibro) => {
    const libroManual = { ...nuevoLibro, origen: "Manual" };
    setBooks((prev) => [...prev, libroManual]);
    addFavorito(libroManual);
    setShowModal(false);
  };

  return (
    <div className="app">
      <header>
        <h1>🏛️ Biblioteca Virtual</h1>
        <button className="btn-agregar" onClick={() => setShowModal(true)}>
          Agregar libro manualmente
        </button>
      </header>

      {loading ? (
        <p className="loading">Cargando libros...</p>
      ) : (
        <>
          <section>
            <h3>
              👓 Bienvenido a la Biblioteca Virtual, un espacio donde podrás descubrir, buscar y guardar tus libros favoritos. 
              Explora una amplia colección de títulos obtenidos en tiempo real desde OpenLibrary, conoce sus autores, años de publicación 
              y detalles, o añade tus propios libros manualmente. 📚
            </h3>

            <h2>Libros Disponibles 📖</h2>
            <ListaLibros
              libros={books}
              onAgregarFavorito={addFavorito}
              favoritos={favoritos}
              modo="normal"
            />
          </section>

          <section>
            <h2>Mis Favoritos ❤️</h2>
            <ListaLibros libros={favoritos} onEliminar={deleteFavorito} modo="favoritos" />
          </section>
        </>
      )}

      {showModal && (
        <AgregarLibros
          onAgregar={addBook}
          onCerrar={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default App;
