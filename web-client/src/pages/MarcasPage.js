// web-client/src/pages/MarcaPage.js

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
  Table, // Para listar las marcas
} from 'react-bootstrap';

const API_BASE_URL = 'http://localhost:8000/api';

const MarcaPage = () => {
  const [marcas, setMarcas] = useState([]); // Para almacenar la lista de marcas
  const [formData, setFormData] = useState({ // Para el formulario de agregar/editar
    nombre: '',
    imagen: '',
  });
  const [editingMarcaId, setEditingMarcaId] = useState(null); // Para saber si estamos editando
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función para cargar todas las marcas
  const fetchMarcas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/marcas/`);
      setMarcas(response.data);
      setSuccess(''); // Limpiar éxito anterior al recargar lista
    } catch (err) {
      console.error('Error al cargar marcas:', err.response ? err.response.data : err.message);
      setError('Error al cargar marcas. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar marcas al montar el componente
  useEffect(() => {
    fetchMarcas();
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
      if (editingMarcaId) {
        // Modo Edición: PUT para actualizar
        await axios.put(`${API_BASE_URL}/marcas/${editingMarcaId}/`, formData);
        setSuccess('Marca actualizada exitosamente!');
      } else {
        // Modo Creación: POST para agregar
        await axios.post(`${API_BASE_URL}/marcas/`, formData);
        setSuccess('Marca agregada exitosamente!');
      }
      
      setFormData({ nombre: '', imagen: '' }); // Limpiar formulario
      setEditingMarcaId(null); // Salir del modo edición
      fetchMarcas(); // Recargar la lista de marcas
    } catch (err) {
      console.error('Error al guardar marca:', err.response ? err.response.data : err.message);
      const errorMsg = err.response && err.response.data
        ? Object.values(err.response.data).flat().join(' ')
        : `Error al ${editingMarcaId ? 'actualizar' : 'agregar'} la marca. Inténtalo de nuevo.`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (marca) => {
    setFormData({ nombre: marca.nombre, imagen: marca.imagen });
    setEditingMarcaId(marca.id);
    setError(''); // Limpiar errores al editar
    setSuccess(''); // Limpiar éxitos al editar
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta marca?')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await axios.delete(`${API_BASE_URL}/marcas/${id}/`);
        setSuccess('Marca eliminada exitosamente!');
        fetchMarcas(); // Recargar la lista
      } catch (err) {
        console.error('Error al eliminar marca:', err.response ? err.response.data : err.message);
        setError('Error al eliminar la marca. Podría estar en uso.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearForm = () => {
    setFormData({ nombre: '', imagen: '' });
    setEditingMarcaId(null);
    setError('');
    setSuccess('');
  };

  return (
    <Container className="my-4">
      <Card className="shadow-lg rounded-lg">
        <Card.Body className="p-4 p-md-5">
          <h1 className="text-center mb-4 text-primary fw-bold border-bottom pb-2">
            {editingMarcaId ? 'Editar Marca' : 'Agregar Nueva Marca'}
          </h1>

          {/* Mensajes de éxito/error */}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          {/* Formulario de Agregar/Editar Marca */}
          <Form onSubmit={handleSubmit} className="mb-5">
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group controlId="formMarcaNombre">
                  <Form.Label>Nombre de la Marca <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Samsung"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formMarcaImagen">
                  <Form.Label>URL de Imagen (opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="imagen"
                    value={formData.imagen}
                    onChange={handleChange}
                    placeholder="Ej: http://ejemplo.com/logo-samsung.png"
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
                    {/* Icono de guardar SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-save me-2" viewBox="0 0 16 16">
                      <path d="M.5 1a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5zm-.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H0zM13 1h-.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zM.5 15a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5zm-.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H0zM13 15h-.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zM.5 1a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5z"/>
                      <path d="M8 11.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h1z"/>
                      <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
                      <path d="M10 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    </svg>
                    {editingMarcaId ? 'Actualizar Marca' : 'Agregar Marca'}
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
                {/* Icono de limpiar SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg me-2" viewBox="0 0 16 16">
                  <path d="M2.146 2.146a.5.5 0 0 1 .708 0L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854a.5.5 0 0 1 0-.708z"/>
                </svg>
                Limpiar Formulario
              </Button>
            </div>
          </Form>

          <h2 className="text-center mb-4 mt-5 text-secondary fw-bold border-bottom pb-2">
            Lista de Marcas
          </h2>

          {loading && (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" variant="secondary" />
              <p className="ms-2">Cargando marcas...</p>
            </div>
          )}

          {!loading && marcas.length === 0 && (
            <Alert variant="info" className="text-center">No hay marcas registradas aún.</Alert>
          )}

          {!loading && marcas.length > 0 && (
            <div className="table-responsive"> {/* Hace la tabla scrollable en pantallas pequeñas */}
              <Table striped bordered hover responsive className="mt-3">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Imagen</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {marcas.map((marca) => (
                    <tr key={marca.id}>
                      <td>{marca.id}</td>
                      <td>{marca.nombre}</td>
                      <td>
                        {marca.imagen ? (
                          <img src={marca.imagen} alt={marca.nombre} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditClick(marca)}
                          className="me-2"
                        >
                          {/* Icono de editar SVG */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.121l6.145-6.145z"/>
                            <path fillRule="evenodd" d="M3.793 12.424V14.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5v-1.077c.18-.088.358-.19.531-.309L15.5 3.51a1 1 0 0 0-1.414-1.414L10 8.086 4.707 2.793a1 1 0 0 0-1.414 1.414L8.086 10 2.793 4.707a1 1 0 0 0-1.414 1.414L6.646 11.5c-.119.173-.221.35-.309.531H3.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V14.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V12.424l-3.207-3.207a.5.5 0 0 0-.707 0L.146 10.854a.5.5 0 0 0 0 .708L5.707 16.5a.5.5 0 0 0 .707 0L15.854 6.854a.5.5 0 0 0 0-.708L10.854.146a.5.5 0 0 0-.708 0zM15 15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3z"/>
                          </svg>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(marca.id)}
                        >
                          {/* Icono de eliminar SVG */}
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

export default MarcaPage;