import EliminarLibros from "./EliminarLibros";

const ListaLibros = ({ libros, onAgregarFavorito, onEliminar, modo, favoritos = [] }) => {
  if (!libros || libros.length === 0) {
    return <p className="vacio">No hay libros para mostrar.</p>;
  }

  const esFavorito = (titulo) => {
    return favoritos.some((f) => f.titulo === titulo);
  };

  return (
    <div className="lista-libros">
      <div className="cards-container">
        {libros.map((libro, index) => {
          const yaFavorito = esFavorito(libro.titulo);

          return (
            <div key={index} className={`card ${modo === 'favoritos' ? 'favoritos' : ''}`}>
              {}
              {modo !== 'favoritos' && (
                (libro.portada ? (
                  <img src={libro.portada} alt={`Portada de ${libro.titulo}`} className="portada" />
                ) : (
                  <div className="portada-fallback">📕</div>
                ))
              )}

              <div className="card-body">
                <div className="title-pill">
                  <h3>{libro.titulo}</h3>
                </div>

                <p><strong>Autor:</strong> {libro.autor}</p>
                <p><strong>Año:</strong> {libro.anio}</p>
                {libro.ediciones && <p><strong>Ediciones:</strong> {libro.ediciones}</p>}

                {modo === "normal" ? (
                  <button
                    className={`btn-fav ${yaFavorito ? "btn-fav-activo" : ""}`}
                    onClick={() => {
                      if (!yaFavorito) {
                        onAgregarFavorito(libro);
                        alert(`📚 "${libro.titulo}" se agregó a favoritos`);
                      } else {
                        alert(`👁️ "${libro.titulo}" ya está en tus favoritos`);
                      }
                    }}
                  >
                    {yaFavorito ? "✅ Favorito" : "⭐ Agregar a Favoritos"}
                  </button>
                ) : (
                  <EliminarLibros onEliminar={() => onEliminar(index)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaLibros;
