// web-client/src/pages/ProveedoresPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

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
                    const response = await axios.delete(`${API_PROVEEDORES_URL}${proveedorId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El proveedor ha sido eliminado.', 'success');
                        fetchProveedores(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar proveedor:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar el proveedor.';
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
            <h2 className="mb-4 text-center">Gestión de Proveedores</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nuevo Proveedor */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
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
                                    <Form.Label>Nombre del Proveedor</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={newProveedorData.nombre}
                                        onChange={handleNewProveedorChange}
                                        placeholder="Ej: Distribuidora XYZ"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newProveedorContacto">
                                    <Form.Label>Contacto</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contacto"
                                        value={newProveedorData.contacto}
                                        onChange={handleNewProveedorChange}
                                        placeholder="Ej: Juan Pérez / 123-4567"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-end">
                                <Button variant="success" type="submit" disabled={loading}>
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
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Proveedores Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando proveedores...</span>
                            </Spinner>
                            <p className="mt-2">Cargando proveedores...</p>
                        </div>
                    )}
                    {!loading && proveedores.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay proveedores registrados aún.
                        </div>
                    )}
                    {!loading && proveedores.length > 0 && (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
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
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(proveedor)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
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
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Proveedor
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentProveedor && (
                            <>
                                <Form.Group className="mb-3" controlId="editProveedorNombre">
                                    <Form.Label>Nombre</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={editFormData.nombre}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editProveedorContacto">
                                    <Form.Label>Contacto</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contacto"
                                        value={editFormData.contacto}
                                        onChange={handleEditFormChange}
                                    />
                                </Form.Group>
                            </>
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

export default ProveedoresPage;