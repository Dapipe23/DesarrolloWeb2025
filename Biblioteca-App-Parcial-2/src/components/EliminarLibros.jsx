import React from 'react';

const EliminarLibros = ({ libros, onEliminar }) => {
    const handleDelete = () => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este libro?")) {
            onEliminar();
        }
    };

    return (

        <button className='btn-eliminar' onClick={handleDelete}> 🗑️ Eliminar
        
        </button>

    ); 
};

export default EliminarLibros;
