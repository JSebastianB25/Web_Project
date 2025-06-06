// web-client/src/pages/RolesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes, faUserTag } from '@fortawesome/free-solid-svg-icons'; // faUserTag para roles
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_ROLES_URL = `${API_BASE_URL}/roles/`; // Ajusta esta URL si es diferente

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nuevo rol
    const [newNombreData, setNewNombreData] = useState({
        nombre: ''
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentRol, setCurrentRol] = useState(null); // Rol que se está editando
    const [editFormData, setEditFormData] = useState({
        nombre: ''
    });

    // Función para cargar roles
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching roles from:', API_ROLES_URL);
            const response = await axios.get(API_ROLES_URL);
            console.log('📦 Roles data:', response.data);
            setRoles(response.data || []); // Espera un array directo
        } catch (err) {
            console.error('❌ Error fetching roles:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar los roles. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar los roles.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar roles al montar el componente
    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Manejador para el formulario de nuevo rol
    const handleNewNombreChange = (e) => {
        setNewNombreData({ nombre: e.target.value });
    };

    const handleNewNombreSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_ROLES_URL, newNombreData);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Rol agregado exitosamente.', 'success');
                setNewNombreData({ nombre: '' }); // Limpiar formulario
                fetchRoles(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al agregar rol:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar el rol.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (rol) => {
        setCurrentRol(rol);
        setEditFormData({ nombre: rol.nombre });
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
            // Envía la actualización a la URL específica del rol
            const response = await axios.put(`${API_ROLES_URL}${currentRol.id}/`, editFormData);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Rol actualizado exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchRoles(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar rol:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar el rol.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (rolId) => {
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
                    const response = await axios.delete(`${API_ROLES_URL}${rolId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El rol ha sido eliminado.', 'success');
                        fetchRoles(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar rol:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar el rol.';
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
            <h2 className="mb-4 text-center">Gestión de Roles</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nuevo Rol */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nuevo Rol
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewNombreSubmit}>
                        <Row className="g-3 justify-content-center">
                            <Col md={6}>
                                <Form.Group controlId="newRolNombre">
                                    <Form.Label>Nombre del Rol</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={newNombreData.nombre}
                                            onChange={handleNewNombreChange}
                                            placeholder="Ej: Administrador, Vendedor, Cliente"
                                            required
                                        />
                                    </InputGroup>
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
                                            Agregar Rol
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Roles */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Roles Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando roles...</span>
                            </Spinner>
                            <p className="mt-2">Cargando roles...</p>
                        </div>
                    )}
                    {!loading && roles.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay roles registrados aún.
                        </div>
                    )}
                    {!loading && roles.length > 0 && (
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
                                    {roles.map(rol => (
                                        <tr key={rol.id}>
                                            <td>{rol.id}</td>
                                            <td>{rol.nombre}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(rol)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(rol.id)}
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

            {/* Modal de Edición de Rol */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Rol
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentRol && (
                            <Form.Group className="mb-3" controlId="editRolNombre">
                                <Form.Label>Nombre del Rol</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={editFormData.nombre}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </InputGroup>
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

export default RolesPage;