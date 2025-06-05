// web-client/src/pages/FormasPagoPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card // Importa Card también para las secciones
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_FORMAS_PAGO_URL = `${API_BASE_URL}/formas_pago/`; // Ajusta esta URL si es diferente

const FormasPagoPage = () => {
    const [formasPago, setFormasPago] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nueva forma de pago
    const [newMetodoData, setNewMetodoData] = useState({
        metodo: ''
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentFormaPago, setCurrentFormaPago] = useState(null); // Forma de pago que se está editando
    const [editFormData, setEditFormData] = useState({
        metodo: ''
    });

    // Función para cargar formas de pago
    const fetchFormasPago = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching formas de pago from:', API_FORMAS_PAGO_URL);
            const response = await axios.get(API_FORMAS_PAGO_URL);
            console.log('📦 Formas de pago data:', response.data);
            setFormasPago(response.data || []); // Espera un array directo
        } catch (err) {
            console.error('❌ Error fetching formas de pago:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar las formas de pago. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar las formas de pago.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar formas de pago al montar el componente
    useEffect(() => {
        fetchFormasPago();
    }, [fetchFormasPago]);

    // Manejador para el formulario de nueva forma de pago
    const handleNewMetodoChange = (e) => {
        setNewMetodoData({ metodo: e.target.value });
    };

    const handleNewMetodoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_FORMAS_PAGO_URL, newMetodoData);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Forma de pago agregada exitosamente.', 'success');
                setNewMetodoData({ metodo: '' }); // Limpiar formulario
                fetchFormasPago(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al agregar forma de pago:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar la forma de pago.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (formaPago) => {
        setCurrentFormaPago(formaPago);
        setEditFormData({ metodo: formaPago.metodo });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ metodo: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Envía la actualización a la URL específica de la forma de pago
            const response = await axios.put(`${API_FORMAS_PAGO_URL}${currentFormaPago.id}/`, editFormData);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Forma de pago actualizada exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchFormasPago(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar forma de pago:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar la forma de pago.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (formaPagoId) => {
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
                    const response = await axios.delete(`${API_FORMAS_PAGO_URL}${formaPagoId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminado!', 'La forma de pago ha sido eliminada.', 'success');
                        fetchFormasPago(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar forma de pago:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar la forma de pago.';
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
            <h2 className="mb-4 text-center">Gestión de Formas de Pago</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nueva Forma de Pago */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nueva Forma de Pago
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewMetodoSubmit}>
                        <Row className="g-3 justify-content-center"> {/* Centrar el campo */}
                            <Col md={6}>
                                <Form.Group controlId="newFormaPagoMetodo">
                                    <Form.Label>Método de Pago</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="metodo"
                                        value={newMetodoData.metodo}
                                        onChange={handleNewMetodoChange}
                                        placeholder="Ej: Tarjeta de Crédito, Efectivo, Nequi"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-center"> {/* Botón centrado */}
                                <Button variant="success" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                            Agregando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                                            Agregar Forma de Pago
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Formas de Pago */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Formas de Pago Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando formas de pago...</span>
                            </Spinner>
                            <p className="mt-2">Cargando formas de pago...</p>
                        </div>
                    )}
                    {!loading && formasPago.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay formas de pago registradas aún.
                        </div>
                    )}
                    {!loading && formasPago.length > 0 && (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Método</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formasPago.map(forma => (
                                        <tr key={forma.id}>
                                            <td>{forma.id}</td>
                                            <td>{forma.metodo}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(forma)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(forma.id)}
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

            {/* Modal de Edición de Forma de Pago */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Forma de Pago
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentFormaPago && (
                            <Form.Group className="mb-3" controlId="editFormaPagoMetodo">
                                <Form.Label>Método de Pago</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="metodo"
                                    value={editFormData.metodo}
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

export default FormasPagoPage;