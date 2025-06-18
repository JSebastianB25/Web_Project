// web-client/src/pages/ProveedoresPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, Card, Alert // Añadido Alert para consistencia en mensajes de error
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes, faHandshake } from '@fortawesome/free-solid-svg-icons'; // Añadido faHandshake para el título de la página
import axios from 'axios';
import Swal from 'sweetalert2';

// Importa tus estilos personalizados para esta página
import '../styles/ProveedoresPage.css'; // Nuevo archivo CSS

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PROVEEDORES_URL = `${API_BASE_URL}/proveedores/`;

const ProveedoresPage = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nuevo proveedor
    const [newProveedorData, setNewProveedorData] = useState({
        nombre: '',
        contacto: ''
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentProveedor, setCurrentProveedor] = useState(null); // Proveedor que se está editando
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        contacto: ''
    });

    // Función para cargar proveedores
    const fetchProveedores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching proveedores from:', API_PROVEEDORES_URL);
            const response = await axios.get(API_PROVEEDORES_URL);
            console.log('📦 Proveedores data:', response.data);
            setProveedores(response.data || []); // Espera un array directo
        } catch (err) {
            console.error('❌ Error fetching proveedores:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar los proveedores. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar los proveedores.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar proveedores al montar el componente
    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    // Manejador para el formulario de nuevo proveedor
    const handleNewProveedorChange = (e) => {
        const { name, value } = e.target;
        setNewProveedorData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleNewProveedorSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_PROVEEDORES_URL, newProveedorData);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Proveedor agregado exitosamente.', 'success');
                setNewProveedorData({ nombre: '', contacto: '' }); // Limpiar formulario
                fetchProveedores(); // Recargar la lista de proveedores
            }
        } catch (err) {
            console.error('Error al agregar proveedor:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar el proveedor.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (proveedor) => {
        setCurrentProveedor(proveedor);
        setEditFormData({
            nombre: proveedor.nombre,
            contacto: proveedor.contacto || '' // Asegura que no sea null
        });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Envía la actualización a la URL específica del proveedor
            const response = await axios.put(`${API_PROVEEDORES_URL}${currentProveedor.id}/`, editFormData);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Proveedor actualizado exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchProveedores(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar proveedor:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar el proveedor.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (proveedorId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto! Se eliminará el proveedor.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminarlo!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.delete(`${API_PROVEEDORES_URL}${proveedorId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El proveedor ha sido eliminado.', 'success');
                        fetchProveedores(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar proveedor:', err.response ? err.response.data : err);
                    let errorMessage = 'Ocurrió un error al eliminar el proveedor.';
                    // <<-- AÑADIDO: Manejo de error específico para restricción de clave foránea
                    if (err.response && err.response.status === 400) {
                        const errorData = err.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'No es posible eliminar el proveedor porque tiene productos asociados.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('productos asociados') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'No es posible eliminar el proveedor porque tiene productos asociados.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (err.response && err.response.status === 409) { // Posible conflicto
                        errorMessage = 'No es posible eliminar el proveedor porque tiene productos asociados.';
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
            fluid // Para que ocupe todo el ancho
            className="proveedores-page p-4" // Clase para estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faHandshake} className="me-3" /> Gestión de Proveedores
            </h2>

            {error && <Alert variant="danger" className="text-center proveedores-alert-error">{error}</Alert>} {/* Clase para estilo de alerta */}

            {/* Formulario para Agregar Nuevo Proveedor */}
            <Card className="mb-4 shadow-sm proveedores-card"> {/* Clase para estilo de tarjeta */}
                <Card.Header className="proveedores-card-header-add"> {/* Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nuevo Proveedor
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewProveedorSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="newProveedorNombre">
                                    <Form.Label style={{color: '#000000'}}>Nombre del Proveedor</Form.Label> {/* Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={newProveedorData.nombre}
                                        onChange={handleNewProveedorChange}
                                        placeholder="Ej: Distribuidora XYZ"
                                        required
                                        className="form-control-light" // Clase de estilo
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newProveedorContacto">
                                    <Form.Label style={{color: '#000000'}}>Contacto</Form.Label> {/* Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="contacto"
                                        value={newProveedorData.contacto}
                                        onChange={handleNewProveedorChange}
                                        placeholder="Ej: Juan Pérez / 123-4567"
                                        className="form-control-light" // Clase de estilo
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-end">
                                <Button variant="success" type="submit" disabled={loading} className="btn-add-submit"> {/* Clase de estilo */}
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                            Agregando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                                            Agregar Proveedor
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Proveedores */}
            <Card className="shadow-sm proveedores-card"> {/* Clase para estilo de tarjeta */}
                <Card.Header className="proveedores-card-header-list"> {/* Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Proveedores Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* Color del spinner */}
                                <span className="visually-hidden">Cargando proveedores...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000'}}>Cargando proveedores...</p> {/* Color del texto */}
                        </div>
                    )}
                    {!loading && proveedores.length === 0 && (
                        <Alert variant="info" className="text-center mt-3 proveedores-alert-info"> {/* Clase para estilo de alerta */}
                            No hay proveedores registrados aún.
                        </Alert>
                    )}
                    {!loading && proveedores.length > 0 && (
                        <div className="table-responsive proveedores-table-wrapper"> {/* Clase para estilo de tabla */}
                            <Table striped hover className="mt-3 proveedores-table-light"> {/* Clase para estilo de tabla */}
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Contacto</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proveedores.map(proveedor => (
                                        <tr key={proveedor.id}>
                                            <td>{proveedor.id}</td>
                                            <td>{proveedor.nombre}</td>
                                            <td>{proveedor.contacto || 'N/A'}</td>
                                            <td className="text-center d-flex justify-content-center gap-2"> {/* Usar gap-2 para espacio */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="btn-action-edit" // Clase de estilo
                                                    onClick={() => handleEditClick(proveedor)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="btn-action-delete" // Clase de estilo
                                                    onClick={() => handleDeleteClick(proveedor.id)}
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

            {/* Modal de Edición de Proveedor */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="modal-header-light"> {/* Clase de estilo */}
                    <Modal.Title className="modal-title-light"> {/* Clase de estilo */}
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Proveedor
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body className="modal-body-light"> {/* Clase de estilo */}
                        {currentProveedor && (
                            <>
                                <Form.Group className="mb-3" controlId="editProveedorNombre">
                                    <Form.Label style={{color: '#000000'}}>Nombre</Form.Label> {/* Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={editFormData.nombre}
                                        onChange={handleEditFormChange}
                                        required
                                        className="form-control-light" // Clase de estilo
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editProveedorContacto">
                                    <Form.Label style={{color: '#000000'}}>Contacto</Form.Label> {/* Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="contacto"
                                        value={editFormData.contacto}
                                        onChange={handleEditFormChange}
                                        className="form-control-light" // Clase de estilo
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="modal-footer-light"> {/* Clase de estilo */}
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} className="btn-close-modal"> {/* Clase de estilo */}
                            <FontAwesomeIcon icon={faTimes} className="me-2" />
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} className="btn-save-modal"> {/* Clase de estilo */}
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

export default ProveedoresPage;