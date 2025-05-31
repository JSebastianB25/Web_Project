// web-client/src/pages/CategoriaPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Card,
  Table,
} from 'react-bootstrap';

const API_BASE_URL = 'http://localhost:8000/api'; // Asegúrate de que esta URL sea correcta

const CategoriaPage = () => {
  const [categorias, setCategorias] = useState([]); // Para almacenar la lista de categorías
  const [formData, setFormData] = useState({ // Para el formulario de agregar/editar
    nombre: '',
  });
  const [editingCategoriaId, setEditingCategoriaId] = useState(null); // Para saber si estamos editando
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función para cargar todas las categorías
  const fetchCategorias = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/categorias/`);
      setCategorias(response.data);
      setSuccess(''); // Limpiar éxito anterior al recargar lista
    } catch (err) {
      console.error('Error al cargar categorías:', err.response ? err.response.data : err.message);
      setError('Error al cargar categorías. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingCategoriaId) {
        // Modo Edición: PUT para actualizar
        await axios.put(`${API_BASE_URL}/categorias/${editingCategoriaId}/`, formData);
        setSuccess('Categoría actualizada exitosamente!');
      } else {
        // Modo Creación: POST para agregar
        await axios.post(`${API_BASE_URL}/categorias/`, formData);
        setSuccess('Categoría agregada exitosamente!');
      }
      
      setFormData({ nombre: '' }); // Limpiar formulario
      setEditingCategoriaId(null); // Salir del modo edición
      fetchCategorias(); // Recargar la lista de categorías
    } catch (err) {
      console.error('Error al guardar categoría:', err.response ? err.response.data : err.message);
      const errorMsg = err.response && err.response.data
        ? Object.values(err.response.data).flat().join(' ')
        : `Error al ${editingCategoriaId ? 'actualizar' : 'agregar'} la categoría. Inténtalo de nuevo.`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (categoria) => {
    setFormData({ nombre: categoria.nombre });
    setEditingCategoriaId(categoria.id);
    setError(''); // Limpiar errores al editar
    setSuccess(''); // Limpiar éxitos al editar
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await axios.delete(`${API_BASE_URL}/categorias/${id}/`);
        setSuccess('Categoría eliminada exitosamente!');
        fetchCategorias(); // Recargar la lista
      } catch (err) {
        console.error('Error al eliminar categoría:', err.response ? err.response.data : err.message);
        setError('Error al eliminar la categoría. Podría estar en uso.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearForm = () => {
    setFormData({ nombre: '' });
    setEditingCategoriaId(null);
    setError('');
    setSuccess('');
  };

  return (
    <Container className="my-4">
      <Card className="shadow-lg rounded-lg">
        <Card.Body className="p-4 p-md-5">
          <h1 className="text-center mb-4 text-primary fw-bold border-bottom pb-2">
            {editingCategoriaId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
          </h1>

          {/* Mensajes de éxito/error */}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          {/* Formulario de Agregar/Editar Categoría */}
          <Form onSubmit={handleSubmit} className="mb-5">
            <Row className="g-3 mb-4 justify-content-center"> {/* Centrar el campo de nombre */}
              <Col md={6}>
                <Form.Group controlId="formCategoriaNombre">
                  <Form.Label>Nombre de la Categoría <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Electrónica, Ropa, Alimentos"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="px-4 py-2"
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-save me-2" viewBox="0 0 16 16">
                      <path d="M.5 1a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5zm-.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H0zM13 1h-.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zM.5 15a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5zm-.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H0zM13 15h-.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zM.5 1a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5z"/>
                      <path d="M8 11.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h1z"/>
                      <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
                      <path d="M10 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    </svg>
                    {editingCategoriaId ? 'Actualizar Categoría' : 'Agregar Categoría'}
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClearForm}
                disabled={loading}
                className="px-4 py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg me-2" viewBox="0 0 16 16">
                  <path d="M2.146 2.146a.5.5 0 0 1 .708 0L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854a.5.5 0 0 1 0-.708z"/>
                </svg>
                Limpiar Formulario
              </Button>
            </div>
          </Form>

          <h2 className="text-center mb-4 mt-5 text-secondary fw-bold border-bottom pb-2">
            Lista de Categorías
          </h2>

          {loading && (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" variant="secondary" />
              <p className="ms-2">Cargando categorías...</p>
            </div>
          )}

          {!loading && categorias.length === 0 && (
            <Alert variant="info" className="text-center">No hay categorías registradas aún.</Alert>
          )}

          {!loading && categorias.length > 0 && (
            <div className="table-responsive">
              <Table striped bordered hover responsive className="mt-3">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>{categoria.id}</td>
                      <td>{categoria.nombre}</td>
                      <td className="text-center">
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditClick(categoria)}
                          className="me-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.121l6.145-6.145z"/>
                            <path fillRule="evenodd" d="M3.793 12.424V14.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5v-1.077c.18-.088.358-.19.531-.309L15.5 3.51a1 1 0 0 0-1.414-1.414L10 8.086 4.707 2.793a1 1 0 0 0-1.414 1.414L8.086 10 2.793 4.707a1 1 0 0 0-1.414 1.414L6.646 11.5c-.119.173-.221.35-.309.531H3.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V14.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V12.424l-3.207-3.207a.5.5 0 0 0-.707 0L.146 10.854a.5.5 0 0 0 0 .708L5.707 16.5a.5.5 0 0 0 .707 0L15.854 6.854a.5.5 0 0 0 0-.708L10.854.146a.5.5 0 0 0-.708 0zM15 15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3z"/>
                          </svg>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(categoria.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13V9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1h.5a1 1 0 0 1 1 1V3zM3.5 1h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1 0-1zM4 4h8V9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4zm4 4.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V8.5zm-3 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V8.5zm6 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V8.5z"/>
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          </svg>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CategoriaPage;