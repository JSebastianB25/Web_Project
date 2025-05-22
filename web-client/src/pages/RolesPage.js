// src/pages/RolesPage.js
import React, { useState } from 'react';

const RolesPage = () => {
  const [newRol, setNewRol] = useState({
    nombre: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRol(prevRol => ({
      ...prevRol,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newRol.nombre) {
      setError({ message: 'Por favor, introduce el nombre del rol.' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/roles/', { // Adjust API endpoint if different
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newRol),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.nombre ? `Nombre de rol ya existe: ${errorData.nombre[0]}` : `Error al agregar rol: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedRol = await response.json();
      setSuccessMessage(`Rol "${addedRol.nombre}" agregado exitosamente.`);

      // Reset the form
      setNewRol({
        nombre: '',
      });

    } catch (err) {
      console.error("Error adding rol:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content generic-page-container">
      <h2 className="page-heading">➕ Nuevo Rol</h2>

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
          {/* Nombre del Rol */}
          <div className="form-group-full-width">
            <label htmlFor="nombre" className="form-label">
              Nombre del Rol: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={newRol.nombre}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: Administrador, Vendedor"
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
                <span role="img" aria-label="add">➕</span> Agregar Rol
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RolesPage;