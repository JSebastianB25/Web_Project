// src/pages/PermisosPage.js
import React, { useState, useEffect } from 'react';

const PermisosPage = () => {
  const [newPermiso, setNewPermiso] = useState({
    nombre: '',
    descripcion: '',
    rol: '', // Will store the selected role's ID
  });

  const [roles, setRoles] = useState([]); // State to store list of roles
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/roles/'); // Adjust API endpoint
        if (!response.ok) throw new Error(`Error al cargar roles: ${response.status}`);
        const data = await response.json();
        setRoles(data);
      } catch (err) {
        console.error("Error al cargar roles:", err);
        setError(err); // Set error for fetching roles
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []); // Run once on component mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPermiso(prevPermiso => ({
      ...prevPermiso,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newPermiso.nombre || !newPermiso.rol) {
      setError({ message: 'Por favor, completa los campos obligatorios (Nombre y Rol).' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/permisos/', { // Adjust API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newPermiso),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.non_field_errors ? errorData.non_field_errors[0] : `Error al agregar permiso: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedPermiso = await response.json();
      setSuccessMessage(`Permiso "${addedPermiso.nombre}" agregado exitosamente.`);

      // Reset the form
      setNewPermiso({
        nombre: '',
        descripcion: '',
        rol: '',
      });

    } catch (err) {
      console.error("Error adding permiso:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoles) {
    return (
      <div className="page-content generic-page-container">
        <div className="loading-message">
          <span role="img" aria-label="loading">⏳</span> Cargando roles...
        </div>
      </div>
    );
  }

  return (
    <div className="page-content generic-page-container">
      <h2 className="page-heading">➕ Nuevo Permiso</h2>

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
          {/* Nombre del Permiso */}
          <div className="form-group-full-width">
            <label htmlFor="nombre" className="form-label">
              Nombre del Permiso: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={newPermiso.nombre}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: Crear Productos, Editar Usuarios"
            />
          </div>

          {/* Descripción */}
          <div className="form-group-full-width">
            <label htmlFor="descripcion" className="form-label">
              Descripción (opcional):
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={newPermiso.descripcion}
              onChange={handleInputChange}
              rows="3"
              className="form-textarea"
              placeholder="Describe la acción que este permiso permite."
            ></textarea>
          </div>

          {/* Rol asociado */}
          <div className="form-group-full-width">
            <label htmlFor="rol" className="form-label">
              Rol Asociado: <span className="required-field">*</span>
            </label>
            <select
              id="rol"
              name="rol"
              value={newPermiso.rol}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">-- Selecciona un rol --</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
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
                <span role="img" aria-label="add">➕</span> Agregar Permiso
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PermisosPage;