// src/pages/UsuariosPage.js
import React, { useState, useEffect } from 'react';

const UsuariosPage = () => {
  const [newUsuario, setNewUsuario] = useState({
    username: '',
    password: '',
    email: '',
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
    setNewUsuario(prevUsuario => ({
      ...prevUsuario,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newUsuario.username || !newUsuario.password || !newUsuario.email || !newUsuario.rol) {
      setError({ message: 'Por favor, completa todos los campos obligatorios.' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/usuarios/', { // Adjust API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(newUsuario),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Error al agregar usuario.';
        if (errorData.username) errorMessage = `Nombre de usuario ya existe: ${errorData.username[0]}`;
        else if (errorData.email) errorMessage = `Email ya registrado: ${errorData.email[0]}`;
        else if (errorData.non_field_errors) errorMessage = errorData.non_field_errors[0];
        else errorMessage = `Error al agregar usuario: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedUsuario = await response.json();
      setSuccessMessage(`Usuario "${addedUsuario.username}" agregado exitosamente.`);

      // Reset the form
      setNewUsuario({
        username: '',
        password: '',
        email: '',
        rol: '',
      });

    } catch (err) {
      console.error("Error adding usuario:", err);
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
      <h2 className="page-heading">➕ Nuevo Usuario</h2>

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
          {/* Username */}
          <div className="form-group-full-width">
            <label htmlFor="username" className="form-label">
              Nombre de Usuario: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={newUsuario.username}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Ej: jdoe"
            />
          </div>

          {/* Password */}
          <div className="form-group-full-width">
            <label htmlFor="password" className="form-label">
              Contraseña: <span className="required-field">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={newUsuario.password}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Mínimo 8 caracteres"
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
              value={newUsuario.email}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="ejemplo@dominio.com"
            />
          </div>

          {/* Rol */}
          <div className="form-group-full-width">
            <label htmlFor="rol" className="form-label">
              Rol: <span className="required-field">*</span>
            </label>
            <select
              id="rol"
              name="rol"
              value={newUsuario.rol}
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
                <span role="img" aria-label="add">➕</span> Crear Usuario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsuariosPage;