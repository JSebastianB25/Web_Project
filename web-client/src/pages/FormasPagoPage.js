// src/pages/FormasPagoPage.js
import React, { useState } from 'react';

const FormasPagoPage = () => {
  const [newFormaPago, setNewFormaPago] = useState({
    metodo: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFormaPago(prevFormaPago => ({
      ...prevFormaPago,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newFormaPago.metodo) {
      setError({ message: 'Por favor, introduce el método de pago.' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/formas-pago/', { // Adjust API endpoint if different
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newFormaPago),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.metodo ? `Método de pago ya existe: ${errorData.metodo[0]}` : `Error al agregar método de pago: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedFormaPago = await response.json();
      setSuccessMessage(`Método de pago "${addedFormaPago.metodo}" agregado exitosamente.`);

      // Reset the form
      setNewFormaPago({
        metodo: '',
      });

    } catch (err) {
      console.error("Error adding forma de pago:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content generic-page-container">
      <h2 className="page-heading">➕ Nueva Forma de Pago</h2>

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
          {/* Método de Pago */}
          <div className="form-group-full-width">
            <label htmlFor="metodo" className="form-label">
              Método de Pago: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="metodo"
              name="metodo"
              value={newFormaPago.metodo}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: Efectivo, Tarjeta de Crédito"
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
                <span role="img" aria-label="add">➕</span> Agregar Método
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormasPagoPage;