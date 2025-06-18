// web-client/src/pages/PermisosPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card, Alert // <<-- AÑADIDO: Alert para consistencia en mensajes de error
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faEdit, faTrash, faSpinner, faInfoCircle,
    faSave, faTimes, faKey, faUserTag, faAlignLeft, faUserCog // <<-- AÑADIDO: faUserCog para el título de la página
} from '@fortawesome/free-solid-svg-icons'; // faKey para permisos
import axios from 'axios';
import Swal from 'sweetalert2';

// Importa tus estilos personalizados para esta página
import '../styles/PermisosPage.css'; // <<-- NUEVO ARCHIVO CSS

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PERMISOS_URL = `${API_BASE_URL}/permisos/`; // Ajusta esta URL si es diferente
const API_ROLES_URL = `${API_BASE_URL}/roles/`;     // URL para obtener la lista de roles

const PermisosPage = () => {
    const [permisos, setPermisos] = useState([]);
    const [roles, setRoles] = useState([]); // Nuevo estado para almacenar los roles
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nuevo permiso
    const [newPermisoData, setNewPermisoData] = useState({
        nombre: '',
        descripcion: '',
        rol: '' // Almacenará el ID del rol seleccionado
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPermiso, setCurrentPermiso] = useState(null); // Permiso que se está editando
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        descripcion: '',
        rol: '' // Almacenará el ID del rol seleccionado
    });

    // Función para cargar permisos
    const fetchPermisos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching permisos from:', API_PERMISOS_URL);
            const response = await axios.get(API_PERMISOS_URL);
            console.log('📦 Permisos data:', response.data);
            setPermisos(response.data || []);
        } catch (err) {
            console.error('❌ Error fetching permisos:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar los permisos. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar los permisos.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para cargar roles (necesaria para el selector)
    const fetchRoles = useCallback(async () => {
        try {
            console.log('🔗 Fetching roles from:', API_ROLES_URL);
            const response = await axios.get(API_ROLES_URL);
            console.log('📦 Roles data for selector:', response.data);
            setRoles(response.data || []);
        } catch (err) {
            console.error('❌ Error fetching roles for selector:', err.response ? err.response.data : err.message);
            Swal.fire('Error', 'No se pudieron cargar los roles para el selector.', 'error');
        }
    }, []);


    // Cargar permisos y roles al montar el componente
    useEffect(() => {
        fetchPermisos();
        fetchRoles(); // Cargar roles también
    }, [fetchPermisos, fetchRoles]);

    // Manejador para el formulario de nuevo permiso
    const handleNewPermisoChange = (e) => {
        const { name, value } = e.target;
        setNewPermisoData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleNewPermisoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Asegúrate de que el 'rol' sea un número (ID)
            const payload = {
                ...newPermisoData,
                rol: parseInt(newPermisoData.rol, 10) // Convertir a entero
            };
            const response = await axios.post(API_PERMISOS_URL, payload);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Permiso agregado exitosamente.', 'success');
                setNewPermisoData({ nombre: '', descripcion: '', rol: '' }); // Limpiar formulario
                fetchPermisos(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al agregar permiso:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar el permiso.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (permiso) => {
        setCurrentPermiso(permiso);
        // Para editar, el 'rol' en editFormData debe ser el ID del rol
        setEditFormData({
            nombre: permiso.nombre,
            descripcion: permiso.descripcion || '',
            rol: permiso.rol && permiso.rol.id ? String(permiso.rol.id) : '' // Si rol es un objeto, toma su ID como string; si no, cadena vacía
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
            // Asegúrate de que el 'rol' sea un número (ID) para el PUT
            const payload = {
                ...editFormData,
                rol: parseInt(editFormData.rol, 10) // Convertir a entero
            };
            const response = await axios.put(`${API_PERMISOS_URL}${currentPermiso.id}/`, payload);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Permiso actualizado exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchPermisos(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar permiso:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar el permiso.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (permisoId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto! Si este permiso está asignado a usuarios o roles, no podrá ser eliminado.", // <<-- MENSAJE CLARO
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
                    const response = await axios.delete(`${API_PERMISOS_URL}${permisoId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El permiso ha sido eliminado.', 'success');
                        fetchPermisos(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar permiso:', err.response ? err.response.data : err);
                    let errorMessage = 'Ocurrió un error al eliminar el permiso.';
                    // <<-- AÑADIDO: Manejo de error específico para restricción de clave foránea
                    if (err.response && err.response.status === 400) { // Bad Request, puede contener mensaje específico
                        const errorData = err.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'No es posible eliminar el permiso porque está asociado a uno o más roles o usuarios.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('roles asociados') || String(msg).includes('usuarios asociados') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'No es posible eliminar el permiso porque está asociado a uno o más roles o usuarios.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (err.response && err.response.status === 409) { // Posible conflicto
                        errorMessage = 'No es posible eliminar el permiso porque está asociado a uno o más roles o usuarios.';
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
            className="permisos-page p-4" // <<-- AÑADIDO: Clase para estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faUserCog} className="me-3" /> Gestión de Permisos
            </h2>

            {error && <Alert variant="danger" className="text-center permisos-alert-error">{error}</Alert>} {/* <<-- AÑADIDO: Clase para estilo de alerta */}

            {/* Formulario para Agregar Nuevo Permiso */}
            <Card className="mb-4 shadow-sm permisos-card"> {/* <<-- AÑADIDO: Clase para estilo de tarjeta */}
                <Card.Header className="permisos-card-header-add"> {/* <<-- AÑADIDO: Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nuevo Permiso
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewPermisoSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="newPermisoNombre">
                                    <Form.Label style={{color: '#000000'}}>Nombre del Permiso</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faKey} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={newPermisoData.nombre}
                                            onChange={handleNewPermisoChange}
                                            placeholder="Ej: gestionar_productos"
                                            required
                                            className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newPermisoDescripcion">
                                    <Form.Label style={{color: '#000000'}}>Descripción</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faAlignLeft} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                        <Form.Control
                                            as="textarea" // Usar textarea para descripciones más largas
                                            name="descripcion"
                                            value={newPermisoData.descripcion}
                                            onChange={handleNewPermisoChange}
                                            placeholder="Ej: Permite crear, editar y eliminar productos."
                                            rows={2} // Altura inicial del textarea
                                            className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newPermisoRol">
                                    <Form.Label style={{color: '#000000'}}>Rol Asociado</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                        <Form.Select
                                            name="rol"
                                            value={newPermisoData.rol}
                                            onChange={handleNewPermisoChange}
                                            required
                                            className="form-select-light" // <<-- AÑADIDO: Clase de estilo
                                        >
                                            <option value="">Selecciona un Rol</option>
                                            {roles.map(rol => (
                                                <option key={rol.id} value={rol.id}>
                                                    {rol.nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
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
                                            Agregar Permiso
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Permisos */}
            <Card className="shadow-sm permisos-card"> {/* <<-- AÑADIDO: Clase para estilo de tarjeta */}
                <Card.Header className="permisos-card-header-list"> {/* <<-- AÑADIDO: Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Permisos Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* <<-- AÑADIDO: Color del spinner */}
                                <span className="visually-hidden">Cargando permisos...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000'}}>Cargando permisos...</p> {/* <<-- AÑADIDO: Color del texto */}
                        </div>
                    )}
                    {!loading && permisos.length === 0 && (
                        <Alert variant="info" className="text-center mt-3 permisos-alert-info"> {/* <<-- AÑADIDO: Clase para estilo de alerta */}
                            No hay permisos registrados aún.
                        </Alert>
                    )}
                    {!loading && permisos.length > 0 && (
                        <div className="table-responsive permisos-table-wrapper"> {/* <<-- AÑADIDO: Clase para estilo de tabla */}
                            <Table striped hover className="mt-3 permisos-table-light"> {/* <<-- AÑADIDO: Clase para estilo de tabla */}
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Rol</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permisos.map(permiso => (
                                        <tr key={permiso.id}>
                                            <td>{permiso.id}</td>
                                            <td>{permiso.nombre}</td>
                                            <td>{permiso.descripcion || 'Sin descripción'}</td>
                                            {/* Acceder al nombre del rol a través del objeto 'rol' */}
                                            <td>{permiso.rol ? permiso.rol.nombre : 'N/A'}</td>
                                            <td className="text-center d-flex justify-content-center gap-2"> {/* <<-- AÑADIDO: Usar gap-2 para espacio */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="btn-action-edit" // <<-- AÑADIDO: Clase de estilo
                                                    onClick={() => handleEditClick(permiso)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="btn-action-delete" // <<-- AÑADIDO: Clase de estilo
                                                    onClick={() => handleDeleteClick(permiso.id)}
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

            {/* Modal de Edición de Permiso */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="modal-header-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                    <Modal.Title className="modal-title-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Permiso
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body className="modal-body-light"> {/* <<-- AÑADIDO: Clase de estilo */}
                        {currentPermiso && (
                            <>
                                <Form.Group className="mb-3" controlId="editPermisoNombre">
                                    <Form.Label style={{color: '#000000'}}>Nombre del Permiso</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faKey} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
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
                                <Form.Group className="mb-3" controlId="editPermisoDescripcion">
                                    <Form.Label style={{color: '#000000'}}>Descripción</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faAlignLeft} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                        <Form.Control
                                            as="textarea"
                                            name="descripcion"
                                            value={editFormData.descripcion}
                                            onChange={handleEditFormChange}
                                            rows={2}
                                            className="form-control-light" // <<-- AÑADIDO: Clase de estilo
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editPermisoRol">
                                    <Form.Label style={{color: '#000000'}}>Rol Asociado</Form.Label> {/* <<-- AÑADIDO: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text> {/* <<-- AÑADIDO: Clase de estilo */}
                                        <Form.Select
                                            name="rol"
                                            value={editFormData.rol}
                                            onChange={handleEditFormChange}
                                            required
                                            className="form-select-light" // <<-- AÑADIDO: Clase de estilo
                                        >
                                            <option value="">Selecciona un Rol</option>
                                            {roles.map(rol => (
                                                <option key={rol.id} value={rol.id}>
                                                    {rol.nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </InputGroup>
                                </Form.Group>
                            </>
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

export default PermisosPage;
