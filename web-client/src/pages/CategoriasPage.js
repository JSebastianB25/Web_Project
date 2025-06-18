// web-client/src/pages/CategoriasPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, Card, Alert // <<-- AÑADIDO: Alert para consistencia en mensajes de error
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes, faBoxes } from '@fortawesome/free-solid-svg-icons'; // <<-- AÑADIDO: faBoxes para el título de la página
import axios from 'axios';
import Swal from 'sweetalert2';

// Importa tus estilos personalizados para esta página
import '../styles/CategoriasPage.css'; // <<-- NUEVO ARCHIVO CSS

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
            text: "¡No podrás revertir esto! Se eliminará la categoría.", // <<-- MENSAJE CLARO
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // <<-- CAMBIADO: Rojo para eliminar
            cancelButtonColor: '#6c757d', // <<-- CAMBIADO: Gris para cancelar
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
                    let errorMessage = 'Ocurrió un error al eliminar la categoría.';
                    // <<-- AÑADIDO: Manejo de error específico para restricción de clave foránea
                    if (err.response && err.response.status === 400) { // Bad Request, puede contener mensaje específico
                        const errorData = err.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'No es posible eliminar la categoría porque tiene productos asociados.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('productos asociados') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'No es posible eliminar la categoría porque tiene productos asociados.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (err.response && err.response.status === 409) { // Posible conflicto
                        errorMessage = 'No es posible eliminar la categoría porque tiene productos asociados.';
                    } else if (err.message.includes('Network Error')) {
                        errorMessage = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
                    }
                    // <<-- FIN AÑADIDO
                    setError(errorMessage);
                    Swal.fire('Error', errorMessage, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <Container
            fluid // <<-- AÑADIDO: Para que ocupe todo el ancho
            className="categorias-page p-4" // <<-- AÑADIDO: Clase para estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faBoxes} className="me-3" /> Gestión de Categorías
            </h2>

            {error && <Alert variant="danger" className="text-center categorias-alert-error">{error}</Alert>} {/* <<-- AÑADIDO: Clase para estilo de alerta */}

            {/* Formulario para Agregar Nueva Categoría */}
            <Card className="mb-4 shadow-sm categorias-card"> {/* <<-- AÑADIDO: Clase para estilo de tarjeta */}
                <Card.Header className="categorias-card-header-add"> {/* <<-- AÑADIDO: Clase para el header de la tarjeta */}
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
                                    <Form.Label style={{color: '#000000'}}>Nombre de la Categoría</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={newNombreData.nombre}
                                        onChange={handleNewNombreChange}
                                        placeholder="Ej: Electrónica, Ropa, Hogar"
                                        required
                                        className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-center">
                                <Button variant="success" type="submit" disabled={loading} className="btn-add-submit"> {/* <<-- AÑADIDO: Clase de estilo */}
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
            <Card className="shadow-sm categorias-card"> {/* <<-- AÑADIDO: Clase para estilo de tarjeta */}
                <Card.Header className="categorias-card-header-list"> {/* <<-- AÑADIDO: Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Categorías Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* <<-- AÑADIDO: Color del spinner */}
                                <span className="visually-hidden">Cargando categorías...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000'}}>Cargando categorías...</p> {/* <<-- AÑADIDO: Color del texto */}
                        </div>
                    )}
                    {!loading && categorias.length === 0 && (
                        <Alert variant="info" className="text-center mt-3 categorias-alert-info"> {/* <<-- AÑADIDO: Clase para estilo de alerta */}
                            No hay categorías registradas aún.
                        </Alert>
                    )}
                    {!loading && categorias.length > 0 && (
                        <div className="table-responsive categorias-table-wrapper"> {/* <<-- AÑADIDO: Clase para estilo de tabla */}
                            <Table striped hover className="mt-3 categorias-table-light"> {/* <<-- AÑADIDO: Clase para estilo de tabla */}
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
                                            <td className="text-center d-flex justify-content-center gap-2"> {/* <<-- AÑADIDO: Usar gap-2 para espacio */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="btn-action-edit" // <<-- AÑADIDO: Clase de estilo
                                                    onClick={() => handleEditClick(categoria)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="btn-action-delete" // <<-- AÑADIDO: Clase de estilo
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
                <Modal.Header closeButton className="modal-header-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                    <Modal.Title className="modal-title-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Categoría
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body className="modal-body-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        {currentCategoria && (
                            <Form.Group className="mb-3" controlId="editCategoriaNombre">
                                <Form.Label style={{color: '#000000'}}>Nombre de la Categoría</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                <Form.Control
                                    type="text"
                                    name="nombre"
                                    value={editFormData.nombre}
                                    onChange={handleEditFormChange}
                                    required
                                    className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                />
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="modal-footer-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} className="btn-close-modal"> {/* <<-- AÑADIDO: Clase de estilo */}
                            <FontAwesomeIcon icon={faTimes} className="me-2" />
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} className="btn-save-modal"> {/* <<-- AÑADIDO: Clase de estilo */}
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
