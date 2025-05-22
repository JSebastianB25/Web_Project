// src/pages/ClientesPage.js
import React, { useState } from 'react';

const ClientesPage = () => {
  const [newCliente, setNewCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCliente(prevCliente => ({
      ...prevCliente,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newCliente.nombre || !newCliente.email) {
      setError({ message: 'Por favor, completa los campos obligatorios (Nombre y Email).' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/clientes/', { // Adjust API endpoint if different
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newCliente),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Error al agregar cliente.';
        if (errorData.email) errorMessage = `Email ya registrado: ${errorData.email[0]}`;
        else if (errorData.nombre) errorMessage = `Error en el nombre: ${errorData.nombre[0]}`;
        else errorMessage = `Error al agregar cliente: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedCliente = await response.json();
      setSuccessMessage(`Cliente "${addedCliente.nombre}" agregado exitosamente.`);

      // Reset the form
      setNewCliente({
        nombre: '',
        telefono: '',
        email: '',
      });

    } catch (err) {
      console.error("Error adding cliente:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content generic-page-container">
      <h2 className="page-heading">➕ Nuevo Cliente</h2>

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
          {/* Nombre del Cliente */}
          <div className="form-group-full-width">
            <label htmlFor="nombre" className="form-label">
              Nombre del Cliente: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={newCliente.nombre}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: María Gómez"
            />
          </div>

          {/* Teléfono */}
          <div className="form-group-full-width">
            <label htmlFor="telefono" className="form-label">
              Teléfono (opcional):
            </label>
            <input
              type="tel" // Use type="tel" for phone numbers
              id="telefono"
              name="telefono"
              value={newCliente.telefono}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ej: 555-1234"
            />
          </div>

          {/* Email */}
          <div className="form-group-full-width">
            <label htmlFor="email" className="form-label">
              Email: <span className="required-field">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={newCliente.email}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="ejemplo@dominio.com"
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
                <span role="img" aria-label="add">➕</span> Agregar Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientesPage;