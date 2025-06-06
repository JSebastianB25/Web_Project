// web-client/src/pages/ClientesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faEdit, faTrash, faSpinner, faInfoCircle,
    faSave, faTimes, faUser, faPhone, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_CLIENTES_URL = `${API_BASE_URL}/clientes/`; // Ajusta esta URL si es diferente

const ClientesPage = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nuevo cliente
    const [newClienteData, setNewClienteData] = useState({
        nombre: '',
        telefono: '',
        email: ''
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentCliente, setCurrentCliente] = useState(null); // Cliente que se está editando
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        telefono: '',
        email: ''
    });

    // Función para cargar clientes
    const fetchClientes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching clientes from:', API_CLIENTES_URL);
            const response = await axios.get(API_CLIENTES_URL);
            console.log('📦 Clientes data:', response.data);
            setClientes(response.data || []); // Espera un array directo
        } catch (err) {
            console.error('❌ Error fetching clientes:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar los clientes. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar los clientes.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar clientes al montar el componente
    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    // Manejador para el formulario de nuevo cliente
    const handleNewClienteChange = (e) => {
        const { name, value } = e.target;
        setNewClienteData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleNewClienteSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_CLIENTES_URL, newClienteData);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Cliente agregado exitosamente.', 'success');
                setNewClienteData({ nombre: '', telefono: '', email: '' }); // Limpiar formulario
                fetchClientes(); // Recargar la lista de clientes
            }
        } catch (err) {
            console.error('Error al agregar cliente:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar el cliente.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (cliente) => {
        setCurrentCliente(cliente);
        setEditFormData({
            nombre: cliente.nombre,
            telefono: cliente.telefono || '', // Asegura que no sea null
            email: cliente.email
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
            // Envía la actualización a la URL específica del cliente
            const response = await axios.put(`${API_CLIENTES_URL}${currentCliente.id}/`, editFormData);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Cliente actualizado exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchClientes(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar cliente:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar el cliente.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (clienteId) => {
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
                    const response = await axios.delete(`${API_CLIENTES_URL}${clienteId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'El cliente ha sido eliminado.', 'success');
                        fetchClientes(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar cliente:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar el cliente.';
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
            <h2 className="mb-4 text-center">Gestión de Clientes</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nuevo Cliente */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nuevo Cliente
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewClienteSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="newClienteNombre">
                                    <Form.Label>Nombre del Cliente</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={newClienteData.nombre}
                                            onChange={handleNewClienteChange}
                                            placeholder="Ej: Ana María García"
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newClienteTelefono">
                                    <Form.Label>Teléfono</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faPhone} /></InputGroup.Text>
                                        <Form.Control
                                            type="tel"
                                            name="telefono"
                                            value={newClienteData.telefono}
                                            onChange={handleNewClienteChange}
                                            placeholder="Ej: 3001234567"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newClienteEmail">
                                    <Form.Label>Email</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={newClienteData.email}
                                            onChange={handleNewClienteChange}
                                            placeholder="Ej: anagarcia@example.com"
                                            required
                                        />
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
                                            Agregar Cliente
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Clientes */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Clientes Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando clientes...</span>
                            </Spinner>
                            <p className="mt-2">Cargando clientes...</p>
                        </div>
                    )}
                    {!loading && clientes.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay clientes registrados aún.
                        </div>
                    )}
                    {!loading && clientes.length > 0 && (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Teléfono</th>
                                        <th>Email</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientes.map(cliente => (
                                        <tr key={cliente.id}>
                                            <td>{cliente.id}</td>
                                            <td>{cliente.nombre}</td>
                                            <td>{cliente.telefono || 'N/A'}</td>
                                            <td>{cliente.email}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(cliente)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(cliente.id)}
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

            {/* Modal de Edición de Cliente */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Cliente
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentCliente && (
                            <>
                                <Form.Group className="mb-3" controlId="editClienteNombre">
                                    <Form.Label>Nombre</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={editFormData.nombre}
                                            onChange={handleEditFormChange}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editClienteTelefono">
                                    <Form.Label>Teléfono</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faPhone} /></InputGroup.Text>
                                        <Form.Control
                                            type="tel"
                                            name="telefono"
                                            value={editFormData.telefono}
                                            onChange={handleEditFormChange}
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editClienteEmail">
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

export default ClientesPage;