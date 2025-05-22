// src/pages/CategoriasPage.js
import React, { useState } from 'react';

const CategoriasPage = () => {
  const [newCategoria, setNewCategoria] = useState({
    nombre: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategoria(prevCategoria => ({
      ...prevCategoria,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newCategoria.nombre) {
      setError({ message: 'Por favor, introduce el nombre de la categoría.' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/categorias/', { // Adjust API endpoint if different
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newCategoria),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.nombre ? `Nombre de categoría ya existe: ${errorData.nombre[0]}` : `Error al agregar categoría: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedCategoria = await response.json();
      setSuccessMessage(`Categoría "${addedCategoria.nombre}" agregada exitosamente.`);

      // Reset the form
      setNewCategoria({
        nombre: '',
      });

    } catch (err) {
      console.error("Error adding categoria:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content generic-page-container"> {/* Reusing generic container class */}
      <h2 className="page-heading">➕ Nueva Categoría</h2>

      {successMessage && (
        <div className="alert-message success-message">
          <span role="img" aria-label="success">✅</span> {successMessage}
        </div>
      )}
      {error && error.message && (
        <div className="alert-message error-message">
          <span role="img" aria-label="error">❌</span> {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-grid-single-column">
          {/* Nombre de la Categoría */}
          <div className="form-group-full-width">
            <label htmlFor="nombre" className="form-label">
              Nombre de la Categoría: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={newCategoria.nombre}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: Electrónica, Ropa"
            />
          </div>
        </div>

        {/* Botón de envío */}
        <div className="button-container">
          <button type="submit" disabled={submitting} className="submit-button">
            {submitting ? (
              <>
                <span role="img" aria-label="loading">🔄</span> Agregando...
              </>
            ) : (
              <>
                <span role="img" aria-label="add">➕</span> Agregar Categoría
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoriasPage;