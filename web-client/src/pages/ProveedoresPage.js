// src/pages/ProveedoresPage.js
import React, { useState } from 'react';
// No need to import App.css here if it's already imported globally (e.g., in index.js)

const ProveedoresPage = () => {
  const [newProveedor, setNewProveedor] = useState({
    nombre: '',
    contacto: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProveedor(prevProveedor => ({
      ...prevProveedor,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newProveedor.nombre) {
      setError({ message: 'Por favor, introduce el nombre del proveedor.' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/proveedores/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newProveedor),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.nombre ? `Nombre de proveedor ya existe: ${errorData.nombre[0]}` : `Error al agregar proveedor: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedProveedor = await response.json();
      setSuccessMessage(`Proveedor "${addedProveedor.nombre}" agregado exitosamente.`);

      // Reset the form
      setNewProveedor({
        nombre: '',
        contacto: '',
      });

    } catch (err) {
      console.error("Error adding proveedor:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content proveedor-page-container">
      <h2 className="page-heading">➕ Nuevo Proveedor</h2>

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
          {/* Nombre del Proveedor */}
          <div className="form-group-full-width">
            <label htmlFor="nombre" className="form-label">
              Nombre del Proveedor: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={newProveedor.nombre}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: Suministros ABC"
            />
          </div>

          {/* Contacto */}
          <div className="form-group-full-width">
            <label htmlFor="contacto" className="form-label">
              Información de Contacto (opcional):
            </label>
            <textarea
              id="contacto"
              name="contacto"
              value={newProveedor.contacto}
              onChange={handleInputChange}
              rows="3"
              className="form-textarea"
              placeholder="Ej: Juan Pérez - juan@abc.com - 555-1234"
            ></textarea>
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
                <span role="img" aria-label="add">➕</span> Agregar Proveedor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ProveedoresPage;