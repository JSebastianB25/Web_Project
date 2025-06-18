// web-client/src/pages/RolesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card, Alert // <<-- AÑADIDO: Alert para consistencia en mensajes de error
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes, faUserTag, faUsers } from '@fortawesome/free-solid-svg-icons'; // <<-- AÑADIDO: faUsers para el título de la página
import axios from 'axios';
import Swal from 'sweetalert2';

// Importa tus estilos personalizados para esta página
import '../styles/RolesPage.css'; // <<-- NUEVO ARCHIVO CSS

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
            text: "¡No podrás revertir esto! Si este rol tiene usuarios o permisos asociados, no podrá ser eliminado.", // <<-- MENSAJE CLARO
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
                    const response = await axios.delete(`${API_ROLES_URL}${rolId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El rol ha sido eliminado.', 'success');
                        fetchRoles(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar rol:', err.response ? err.response.data : err);
                    let errorMessage = 'Ocurrió un error al eliminar el rol.';
                    // <<-- AÑADIDO: Manejo de error específico para restricción de clave foránea
                    if (err.response && err.response.status === 400) { // Bad Request, puede contener mensaje específico
                        const errorData = err.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'No es posible eliminar el rol porque tiene usuarios o permisos asociados.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('usuarios asociados') || String(msg).includes('permisos asociados') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'No es posible eliminar el rol porque tiene usuarios o permisos asociados.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (err.response && err.response.status === 409) { // Posible conflicto
                        errorMessage = 'No es posible eliminar el rol porque tiene usuarios o permisos asociados.';
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
            className="roles-page p-4" // <<-- AÑADIDO: Clase para estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faUsers} className="me-3" /> Gestión de Roles
            </h2>

            {error && <Alert variant="danger" className="text-center roles-alert-error">{error}</Alert>} {/* <<-- AÑADIDO: Clase para estilo de alerta */}

            {/* Formulario para Agregar Nuevo Rol */}
            <Card className="mb-4 shadow-sm roles-card"> {/* <<-- AÑADIDO: Clase para estilo de tarjeta */}
                <Card.Header className="roles-card-header-add"> {/* <<-- AÑADIDO: Clase para el header de la tarjeta */}
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
                                    <Form.Label style={{color: '#000000'}}>Nombre del Rol</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={newNombreData.nombre}
                                            onChange={handleNewNombreChange}
                                            placeholder="Ej: Administrador, Vendedor, Cliente"
                                            required
                                            className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-end">
                                <Button variant="success" type="submit" disabled={loading} className="btn-add-submit"> {/* <<-- AÑADIDO: Clase de estilo */}
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
            <Card className="shadow-sm roles-card"> {/* <<-- AÑADIDO: Clase para estilo de tarjeta */}
                <Card.Header className="roles-card-header-list"> {/* <<-- AÑADIDO: Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Roles Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* <<-- AÑADIDO: Color del spinner */}
                                <span className="visually-hidden">Cargando roles...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000'}}>Cargando roles...</p> {/* <<-- AÑADIDO: Color del texto */}
                        </div>
                    )}
                    {!loading && roles.length === 0 && (
                        <Alert variant="info" className="text-center mt-3 roles-alert-info"> {/* <<-- AÑADIDO: Clase para estilo de alerta */}
                            No hay roles registrados aún.
                        </Alert>
                    )}
                    {!loading && roles.length > 0 && (
                        <div className="table-responsive roles-table-wrapper"> {/* <<-- AÑADIDO: Clase para estilo de tabla */}
                            <Table striped hover className="mt-3 roles-table-light"> {/* <<-- AÑADIDO: Clase para estilo de tabla */}
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
                                            <td className="text-center d-flex justify-content-center gap-2"> {/* <<-- AÑADIDO: Usar gap-2 para espacio */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="btn-action-edit" // <<-- AÑADIDO: Clase de estilo
                                                    onClick={() => handleEditClick(rol)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="btn-action-delete" // <<-- AÑADIDO: Clase de estilo
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
                <Modal.Header closeButton className="modal-header-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                    <Modal.Title className="modal-title-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Rol
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body className="modal-body-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        {currentRol && (
                            <Form.Group className="mb-3" controlId="editRolNombre">
                                <Form.Label style={{color: '#000000'}}>Nombre del Rol</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                <InputGroup>
                                    <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={editFormData.nombre}
                                        onChange={handleEditFormChange}
                                        required
                                        className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                    />
                                </InputGroup>
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

export default RolesPage;