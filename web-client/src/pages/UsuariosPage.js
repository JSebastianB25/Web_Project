// web-client/src/pages/UsuariosPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faEdit, faTrash, faSpinner, faInfoCircle,
    faSave, faTimes, faUser, faLock, faEnvelope, faUserTag
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios/`; // Ajusta esta URL si es diferente
const API_ROLES_URL = `${API_BASE_URL}/roles/`;     // URL para obtener la lista de roles

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]); // Estado para almacenar los roles
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nuevo usuario
    const [newUserData, setNewUserData] = useState({
        username: '',
        password: '', // Necesario para la creación
        email: '',
        rol: '' // Almacenará el ID del rol seleccionado
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // Usuario que se está editando
    const [editFormData, setEditFormData] = useState({
        username: '',
        // password: '', // No lo precargamos ni mostramos para edición
        email: '',
        rol: ''
    });
    // Estado para la nueva contraseña solo durante la edición
    const [editPassword, setEditPassword] = useState('');


    // Función para cargar usuarios
    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching usuarios from:', API_USUARIOS_URL);
            const response = await axios.get(API_USUARIOS_URL);
            console.log('📦 Usuarios data:', response.data);
            setUsuarios(response.data || []);
        } catch (err) {
            console.error('❌ Error fetching usuarios:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar los usuarios. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
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

    // Cargar usuarios y roles al montar el componente
    useEffect(() => {
        fetchUsuarios();
        fetchRoles(); // Cargar roles también
    }, [fetchUsuarios, fetchRoles]);

    // Manejador para el formulario de nuevo usuario
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleNewUserSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...newUserData,
                rol: newUserData.rol ? parseInt(newUserData.rol, 10) : null // Convertir a entero o null
            };
            console.log('Payload enviado para nuevo usuario:', payload);
            const response = await axios.post(API_USUARIOS_URL, payload);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Usuario agregado exitosamente.', 'success');
                setNewUserData({ username: '', password: '', email: '', rol: '' }); // Limpiar formulario
                fetchUsuarios(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al agregar usuario:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar el usuario.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (usuario) => {
        setCurrentUser(usuario);
        setEditFormData({
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol ? usuario.rol.id : '' // Si rol es un objeto, toma su ID; si no, cadena vacía
        });
        setEditPassword(''); // Limpiar el campo de contraseña al abrir el modal de edición
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleEditPasswordChange = (e) => {
        setEditPassword(e.target.value);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            username: editFormData.username,
            email: editFormData.email,
            rol: editFormData.rol ? parseInt(editFormData.rol, 10) : null // Convertir a entero o null
        };

        // Si se proporciona una nueva contraseña, agrégala al payload
        if (editPassword) {
            payload.password = editPassword;
        }

        try {
            const response = await axios.put(`${API_USUARIOS_URL}${currentUser.id}/`, payload);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Usuario actualizado exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchUsuarios(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar usuario:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar el usuario.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (usuarioId) => {
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
                    const response = await axios.delete(`${API_USUARIOS_URL}${usuarioId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
                        fetchUsuarios(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar usuario:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar el usuario.';
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
            <h2 className="mb-4 text-center">Gestión de Usuarios</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nuevo Usuario */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nuevo Usuario
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewUserSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="newUsername">
                                    <Form.Label>Nombre de Usuario</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={newUserData.username}
                                            onChange={handleNewUserChange}
                                            placeholder="Ej: jdoe, admin_user"
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newEmail">
                                    <Form.Label>Email</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={newUserData.email}
                                            onChange={handleNewUserChange}
                                            placeholder="Ej: usuario@example.com"
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newPassword">
                                    <Form.Label>Contraseña</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faLock} /></InputGroup.Text>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={newUserData.password}
                                            onChange={handleNewUserChange}
                                            placeholder="Ingresa una contraseña segura"
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newRol">
                                    <Form.Label>Rol</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text>
                                        <Form.Select
                                            name="rol"
                                            value={newUserData.rol}
                                            onChange={handleNewUserChange}
                                            required
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
                                <Button variant="success" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                            Agregando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                                            Agregar Usuario
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Usuarios */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Usuarios Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando usuarios...</span>
                            </Spinner>
                            <p className="mt-2">Cargando usuarios...</p>
                        </div>
                    )}
                    {!loading && usuarios.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay usuarios registrados aún.
                        </div>
                    )}
                    {!loading && usuarios.length > 0 && (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre de Usuario</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(usuario => (
                                        <tr key={usuario.id}>
                                            <td>{usuario.id}</td>
                                            <td>{usuario.username}</td>
                                            <td>{usuario.email}</td>
                                            {/* Acceder al nombre del rol a través del objeto 'rol' */}
                                            <td>{usuario.rol ? usuario.rol.nombre : 'Sin Rol'}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(usuario)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(usuario.id)}
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

            {/* Modal de Edición de Usuario */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Usuario
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentUser && (
                            <>
                                <Form.Group className="mb-3" controlId="editUsername">
                                    <Form.Label>Nombre de Usuario</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={editFormData.username}
                                            onChange={handleEditFormChange}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editEmail">
                                    <Form.Label>Email</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editFormData.email}
                                            onChange={handleEditFormChange}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editPassword">
                                    <Form.Label>Nueva Contraseña (opcional)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faLock} /></InputGroup.Text>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={editPassword} // Usa un estado separado para la nueva contraseña
                                            onChange={handleEditPasswordChange}
                                            placeholder="Deja vacío para no cambiar"
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Ingresa una nueva contraseña solo si deseas cambiarla.
                                    </Form.Text>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editRol">
                                    <Form.Label>Rol</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text>
                                        <Form.Select
                                            name="rol"
                                            value={editFormData.rol}
                                            onChange={handleEditFormChange}
                                            required
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

export default UsuariosPage;