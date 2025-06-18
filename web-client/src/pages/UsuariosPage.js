// web-client/src/pages/UsuariosPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card, Alert // Added: Alert for consistent error messages
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faEdit, faTrash, faSpinner, faInfoCircle,
    faSave, faTimes, faUser, faLock, faEnvelope, faUserTag, faUsersCog // Added: faUsersCog for page title
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Import custom styles for this page
import '../styles/UsuariosPage.css'; // New CSS file

// Define your API URLs
const API_BASE_URL = 'http://localhost:8000/api';
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios/`; // Adjust this URL if different
const API_ROLES_URL = `${API_BASE_URL}/roles/`;     // URL to get the list of roles

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]); // State to store roles
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // States for the new user form
    const [newUserData, setNewUserData] = useState({
        username: '',
        password: '', // Needed for creation
        email: '',
        rol: '' // Will store the selected role ID
    });

    // States for the edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // User being edited
    const [editFormData, setEditFormData] = useState({
        username: '',
        // password: '', // We don't pre-load or show it for editing
        email: '',
        rol: ''
    });
    // State for the new password only during editing
    const [editPassword, setEditPassword] = useState('');


    // Function to load users
    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching users from:', API_USUARIOS_URL);
            const response = await axios.get(API_USUARIOS_URL);
            console.log('📦 Users data:', response.data);
            setUsuarios(response.data || []);
        } catch (err) {
            console.error('❌ Error fetching users:', err.response ? err.response.data : err.message);
            setError('Could not load users. Please try again.');
            Swal.fire('Error', 'Could not load users.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Function to load roles (needed for the selector)
    const fetchRoles = useCallback(async () => {
        try {
            console.log('🔗 Fetching roles from:', API_ROLES_URL);
            const response = await axios.get(API_ROLES_URL);
            console.log('📦 Roles data for selector:', response.data);
            setRoles(response.data || []);
        } catch (err) {
            console.error('❌ Error fetching roles for selector:', err.response ? err.response.data : err.message);
            Swal.fire('Error', 'Could not load roles for the selector.', 'error');
        }
    }, []);

    // Load users and roles on component mount
    useEffect(() => {
        fetchUsuarios();
        fetchRoles(); // Load roles as well
    }, [fetchUsuarios, fetchRoles]);

    // Handler for the new user form
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
                rol: newUserData.rol ? parseInt(newUserData.rol, 10) : null // Convert to integer or null
            };
            console.log('Payload sent for new user:', payload);
            const response = await axios.post(API_USUARIOS_URL, payload);
            if (response.status === 201) {
                Swal.fire('Success!', 'User added successfully.', 'success');
                setNewUserData({ username: '', password: '', email: '', rol: '' }); // Clear form
                fetchUsuarios(); // Reload user list
            }
        } catch (err) {
            console.error('Error adding user:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'An error occurred while adding the user.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handlers for the edit modal
    const handleEditClick = (usuario) => {
        setCurrentUser(usuario);
        setEditFormData({
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol && usuario.rol.id ? String(usuario.rol.id) : '' // If rol is an object, get its ID as string; otherwise, empty string
        });
        setEditPassword(''); // Clear the password field when opening the edit modal
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
            rol: editFormData.rol ? parseInt(editFormData.rol, 10) : null // Convert to integer or null
        };

        // If a new password is provided, add it to the payload
        if (editPassword) {
            payload.password = editPassword;
        }

        try {
            const response = await axios.put(`${API_USUARIOS_URL}${currentUser.id}/`, payload);
            if (response.status === 200) {
                Swal.fire('Success!', 'User updated successfully.', 'success');
                setShowEditModal(false); // Close modal
                fetchUsuarios(); // Reload list
            }
        } catch (err) {
            console.error('Error updating user:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'An error occurred while updating the user.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (usuarioId) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! If this user has associated invoices or data, they cannot be deleted.", // <<-- CLEAR MESSAGE
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // <<-- CHANGED: Red for delete
            cancelButtonColor: '#6c757d', // <<-- CHANGED: Gray for cancel
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.delete(`${API_USUARIOS_URL}${usuarioId}/`);
                    if (response.status === 204) { // 204 No Content is success for DELETE
                        Swal.fire('Deleted!', 'The user has been deleted.', 'success');
                        fetchUsuarios(); // Reload list
                    }
                } catch (err) {
                    console.error('Error deleting user:', err.response ? err.response.data : err);
                    let errorMessage = 'An error occurred while deleting the user.';
                    // <<-- ADDED: Specific error handling for foreign key constraint
                    if (err.response && err.response.status === 400) { // Bad Request, may contain specific message
                        const errorData = err.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'Cannot delete the user because they have associated invoices or other data.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('facturas asociadas') || String(msg).includes('data asociada') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'Cannot delete the user because they have associated invoices or other data.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (err.response && err.response.status === 409) { // Conflict
                        errorMessage = 'Cannot delete the user because they have associated invoices or other data.';
                    } else if (err.message.includes('Network Error')) {
                        errorMessage = 'Connection error. Make sure the server is running.';
                    }
                    // <<-- END ADDED
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
            fluid // <<-- ADDED: To take full width
            className="usuarios-page p-4" // <<-- ADDED: Class for base styles
            style={{
                minHeight: 'calc(100vh - 56px)', // Adjust to your Navbar height
                backgroundColor: '#ffffff', // White background for the page
                color: '#000000' // Default text color black
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faUsersCog} className="me-3" /> Gestión de Usuarios
            </h2>

            {error && <Alert variant="danger" className="text-center usuarios-alert-error">{error}</Alert>} {/* <<-- ADDED: Class for alert style */}

            {/* Form to Add New User */}
            <Card className="mb-4 shadow-sm usuarios-card"> {/* <<-- ADDED: Class for card style */}
                <Card.Header className="usuarios-card-header-add"> {/* <<-- ADDED: Class for card header */}
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
                                    <Form.Label style={{color: '#000000'}}>Nombre de Usuario</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUser} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={newUserData.username}
                                            onChange={handleNewUserChange}
                                            placeholder="Ej: jdoe, admin_user"
                                            required
                                            className="form-control-light" // <<-- ADDED: Style class
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newEmail">
                                    <Form.Label style={{color: '#000000'}}>Email</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={newUserData.email}
                                            onChange={handleNewUserChange}
                                            placeholder="Ej: usuario@example.com"
                                            required
                                            className="form-control-light" // <<-- ADDED: Style class
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newPassword">
                                    <Form.Label style={{color: '#000000'}}>Contraseña</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faLock} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={newUserData.password}
                                            onChange={handleNewUserChange}
                                            placeholder="Ingresa una contraseña segura"
                                            required
                                            className="form-control-light" // <<-- ADDED: Style class
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newRol">
                                    <Form.Label style={{color: '#000000'}}>Rol</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Select
                                            name="rol"
                                            value={newUserData.rol}
                                            onChange={handleNewUserChange}
                                            required
                                            className="form-select-light" // <<-- ADDED: Style class
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
                                <Button variant="success" type="submit" disabled={loading} className="btn-add-submit"> {/* <<-- ADDED: Style class */}
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                                            Add User
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* List of Users */}
            <Card className="shadow-sm usuarios-card"> {/* <<-- ADDED: Class for card style */}
                <Card.Header className="usuarios-card-header-list"> {/* <<-- ADDED: Class for card header */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Existing Users
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* <<-- ADDED: Spinner color */}
                                <span className="visually-hidden">Loading users...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000'}}>Loading users...</p> {/* <<-- ADDED: Text color */}
                        </div>
                    )}
                    {!loading && usuarios.length === 0 && (
                        <Alert variant="info" className="text-center mt-3 usuarios-alert-info"> {/* <<-- ADDED: Class for alert style */}
                            No users registered yet.
                        </Alert>
                    )}
                    {!loading && usuarios.length > 0 && (
                        <div className="table-responsive usuarios-table-wrapper"> {/* <<-- ADDED: Class for table style */}
                            <Table striped hover className="mt-3 usuarios-table-light"> {/* <<-- ADDED: Class for table style */}
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(usuario => (
                                        <tr key={usuario.id}>
                                            <td>{usuario.id}</td>
                                            <td>{usuario.username}</td>
                                            <td>{usuario.email}</td>
                                            {/* Access role name through the 'rol' object */}
                                            <td>{usuario.rol ? usuario.rol.nombre : 'No Role'}</td>
                                            <td className="text-center d-flex justify-content-center gap-2"> {/* <<-- ADDED: Use gap-2 for spacing */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="btn-action-edit" // <<-- ADDED: Style class
                                                    onClick={() => handleEditClick(usuario)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Edit
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="btn-action-delete" // <<-- ADDED: Style class
                                                    onClick={() => handleDeleteClick(usuario.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} /> Delete
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

            {/* User Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="modal-header-light"> {/* <<-- ADDED: Style class */}
                    <Modal.Title className="modal-title-light"> {/* <<-- ADDED: Style class */}
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Edit User
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body className="modal-body-light"> {/* <<-- ADDED: Style class */}
                        {currentUser && (
                            <>
                                <Form.Group className="mb-3" controlId="editUsername">
                                    <Form.Label style={{color: '#000000'}}>Username</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUser} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={editFormData.username}
                                            onChange={handleEditFormChange}
                                            required
                                            className="form-control-light" // <<-- ADDED: Style class
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editEmail">
                                    <Form.Label style={{color: '#000000'}}>Email</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editFormData.email}
                                            onChange={handleEditFormChange}
                                            required
                                            className="form-control-light" // <<-- ADDED: Style class
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editPassword">
                                    <Form.Label style={{color: '#000000'}}>New Password (optional)</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faLock} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={editPassword} // Use a separate state for the new password
                                            onChange={handleEditPasswordChange}
                                            placeholder="Leave empty to not change"
                                            className="form-control-light" // <<-- ADDED: Style class
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted" style={{color: '#555555 !important'}}> {/* <<-- ADDED: Text color */}
                                        Enter a new password only if you want to change it.
                                    </Form.Text>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editRol">
                                    <Form.Label style={{color: '#000000'}}>Role</Form.Label> {/* <<-- ADDED: Black color */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faUserTag} /></InputGroup.Text> {/* <<-- ADDED: Style class */}
                                        <Form.Select
                                            name="rol"
                                            value={editFormData.rol}
                                            onChange={handleEditFormChange}
                                            required
                                            className="form-select-light" // <<-- ADDED: Style class
                                        >
                                            <option value="">Select a Role</option>
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
                    <Modal.Footer className="modal-footer-light"> {/* <<-- ADDED: Style class */}
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} className="btn-close-modal"> {/* <<-- ADDED: Style class */}
                            <FontAwesomeIcon icon={faTimes} className="me-2" />
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} className="btn-save-modal"> {/* <<-- ADDED: Style class */}
                            {loading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="me-2" />
                                    Save Changes
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
