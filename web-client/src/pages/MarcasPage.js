// web-client/src/pages/MarcasPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card, Image // <-- Importa Image para la previsualización y mostrar en la tabla
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_MARCAS_URL = `${API_BASE_URL}/marcas/`; // Ajusta esta URL si es diferente

const MarcasPage = () => {
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de nueva marca
    const [newMarcaData, setNewMarcaData] = useState({
        nombre: '',
        imagen: '' // Campo para la URL de la imagen
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentMarca, setCurrentMarca] = useState(null); // Marca que se está editando
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        imagen: ''
    });

    // Función para cargar marcas
    const fetchMarcas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔗 Fetching marcas from:', API_MARCAS_URL);
            const response = await axios.get(API_MARCAS_URL);
            console.log('📦 Marcas data:', response.data);
            setMarcas(response.data || []); // Espera un array directo
        } catch (err) {
            console.error('❌ Error fetching marcas:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar las marcas. Intenta de nuevo.');
            Swal.fire('Error', 'No se pudieron cargar las marcas.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar marcas al montar el componente
    useEffect(() => {
        fetchMarcas();
    }, [fetchMarcas]);

    // Manejador para el formulario de nueva marca
    const handleNewMarcaChange = (e) => {
        const { name, value } = e.target;
        setNewMarcaData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleNewMarcaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_MARCAS_URL, newMarcaData);
            if (response.status === 201) {
                Swal.fire('¡Éxito!', 'Marca agregada exitosamente.', 'success');
                setNewMarcaData({ nombre: '', imagen: '' }); // Limpiar formulario
                fetchMarcas(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al agregar marca:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al agregar la marca.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejadores para el modal de edición
    const handleEditClick = (marca) => {
        setCurrentMarca(marca);
        setEditFormData({
            nombre: marca.nombre,
            imagen: marca.imagen || '' // Asegura que no sea null
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
            // Envía la actualización a la URL específica de la marca
            const response = await axios.put(`${API_MARCAS_URL}${currentMarca.id}/`, editFormData);
            if (response.status === 200) {
                Swal.fire('¡Éxito!', 'Marca actualizada exitosamente.', 'success');
                setShowEditModal(false); // Cerrar modal
                fetchMarcas(); // Recargar la lista
            }
        } catch (err) {
            console.error('Error al actualizar marca:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error al actualizar la marca.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (marcaId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminarla!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.delete(`${API_MARCAS_URL}${marcaId}/`);
                    if (response.status === 204) { // 204 No Content es el éxito para DELETE
                        Swal.fire('¡Eliminada!', 'La marca ha sido eliminada.', 'success');
                        fetchMarcas(); // Recargar la lista
                    }
                } catch (err) {
                    console.error('Error al eliminar marca:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data
                        ? Object.values(err.response.data).flat().join(' ')
                        : 'Ocurrió un error al eliminar la marca.';
                    setError(errorMessage);
                    Swal.fire('Error', errorMessage, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Función auxiliar para previsualizar la imagen
    const renderImagePreview = (imageUrl, altText) => {
        if (!imageUrl) return null;
        const isValidUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
        if (!isValidUrl) return <p className="text-danger mt-2">URL de imagen inválida.</p>;

        return (
            <div className="mt-2 text-center">
                <p className="mb-1 text-muted small">Previsualización:</p>
                <Image
                    src={imageUrl}
                    alt={altText || "Previsualización"}
                    fluid
                    style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', border: '1px solid #ddd', padding: '5px' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x50?text=Imagen+No+Cargada'; }}
                />
            </div>
        );
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Gestión de Marcas</h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Formulario para Agregar Nueva Marca */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Agregar Nueva Marca
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleNewMarcaSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="newMarcaNombre">
                                    <Form.Label>Nombre de la Marca</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={newMarcaData.nombre}
                                        onChange={handleNewMarcaChange}
                                        placeholder="Ej: Samsung, Apple, Oster"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newMarcaImagen">
                                    <Form.Label>URL de la Imagen (Logo)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faImage} /></InputGroup.Text>
                                        <Form.Control
                                            type="url" // Usa type="url" para validación básica del navegador
                                            name="imagen"
                                            value={newMarcaData.imagen}
                                            onChange={handleNewMarcaChange}
                                            placeholder="Ej: https://ejemplo.com/logo.png"
                                        />
                                    </InputGroup>
                                    {renderImagePreview(newMarcaData.imagen, newMarcaData.nombre)}
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
                                            Agregar Marca
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Lista de Marcas */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Marcas Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando marcas...</span>
                            </Spinner>
                            <p className="mt-2">Cargando marcas...</p>
                        </div>
                    )}
                    {!loading && marcas.length === 0 && (
                        <div className="alert alert-info text-center mt-3">
                            No hay marcas registradas aún.
                        </div>
                    )}
                    {!loading && marcas.length > 0 && (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Imagen</th> {/* Nueva columna para la imagen */}
                                        <th>Nombre</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marcas.map(marca => (
                                        <tr key={marca.id}>
                                            <td>{marca.id}</td>
                                            <td>
                                                {/* Muestra la imagen si la URL es válida */}
                                                {marca.imagen ? (
                                                    <Image
                                                        src={marca.imagen}
                                                        alt={marca.nombre}
                                                        style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/50x25?text=No+Img'; }}
                                                    />
                                                ) : (
                                                    <span className="text-muted small">No imagen</span>
                                                )}
                                            </td>
                                            <td>{marca.nombre}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditClick(marca)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(marca.id)}
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

            {/* Modal de Edición de Marca */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Marca
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {currentMarca && (
                            <>
                                <Form.Group className="mb-3" controlId="editMarcaNombre">
                                    <Form.Label>Nombre de la Marca</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={editFormData.nombre}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editMarcaImagen">
                                    <Form.Label>URL de la Imagen (Logo)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FontAwesomeIcon icon={faImage} /></InputGroup.Text>
                                        <Form.Control
                                            type="url"
                                            name="imagen"
                                            value={editFormData.imagen}
                                            onChange={handleEditFormChange}
                                            placeholder="Ej: https://ejemplo.com/logo.png"
                                        />
                                    </InputGroup>
                                    {renderImagePreview(editFormData.imagen, editFormData.nombre)}
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

export default MarcasPage;