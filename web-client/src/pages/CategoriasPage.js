// web-client/src/pages/CategoriasPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias/`; // Ajusta esta URL si es diferente

const CategoriasPage = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nueva categoría
    const [newNombreData, setNewNombreData] = useState({
        nombre: ''
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentCategoria, setCurrentCategoria] = useState(null); // Categoría que se está editando
    const [editFormData, setEditFormData] = useState({
        nombre: ''
    });

    // Función para cargar categorías
    const fetchCategorias = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching categorías from:', API_CATEGORIAS_URL);
            const response = await axios.get(API_CATEGORIAS_URL);
            console.log('📦 Categorías data:', response.data);
            setCategorias(response.data || []); // Espera un array directo
        } catch (err) {
            console.error('❌ Error fetching categorías:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar las categorías. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar las categorías.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar categorías al montar el componente
    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    // Manejador para el formulario de nueva categoría
    const handleNewNombreChange = (e) => {
        setNewNombreData({ nombre: e.target.value });
    };

    const handleNewNombreSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_CATEGORIAS_URL, newNombreData);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Categoría agregada exitosamente.', 'success');
                setNewNombreData({ nombre: '' }); // Limpiar formulario
                fetchCategorias(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al agregar categoría:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar la categoría.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (categoria) => {
        setCurrentCategoria(categoria);
        setEditFormData({ nombre: categoria.nombre });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ nombre: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Envía la actualización a la URL específica de la categoría
            const response = await axios.put(`${API_CATEGORIAS_URL}${currentCategoria.id}/`, editFormData);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Categoría actualizada exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchCategorias(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar categoría:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar la categoría.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (categoriaId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminarlo!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.delete(`${API_CATEGORIAS_URL}${categoriaId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'La categoría ha sido eliminada.', 'success');
                        fetchCategorias(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar categoría:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar la categoría.';
                    setError(errorMessage);
                    Swal.fire('Error', errorMessage, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Gestión de Categorías</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nueva Categoría */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nueva Categoría
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewNombreSubmit}>
                        <Row className="g-3 justify-content-center">
                            <Col md={6}>
                                <Form.Group controlId="newCategoriaNombre">
                                    <Form.Label>Nombre de la Categoría</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={newNombreData.nombre}
                                        onChange={handleNewNombreChange}
                                        placeholder="Ej: Electrónica, Ropa, Hogar"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-center">
                                <Button variant="success" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                            Agregando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                                            Agregar Categoría
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Categorías */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Categorías Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando categorías...</span>
                            </Spinner>
                            <p className="mt-2">Cargando categorías...</p>
                        </div>
                    )}
                    {!loading && categorias.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay categorías registradas aún.
                        </div>
                    )}
                    {!loading && categorias.length > 0 && (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categorias.map(categoria => (
                                        <tr key={categoria.id}>
                                            <td>{categoria.id}</td>
                                            <td>{categoria.nombre}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(categoria)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(categoria.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} /> Eliminar
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

            {/* Modal de Edición de Categoría */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Categoría
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentCategoria && (
                            <Form.Group className="mb-3" controlId="editCategoriaNombre">
                                <Form.Label>Nombre de la Categoría</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombre"
                                    value={editFormData.nombre}
                                    onChange={handleEditFormChange}
                                    required
                                />
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            <FontAwesomeIcon icon={faTimes} className="me-2" />
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="me-2" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default CategoriasPage;