// web-client/src/pages/MarcasPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    Modal, InputGroup, Card, Image, Alert // <-- Añadido Alert
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faInfoCircle, faSave, faTimes, faImage, faTags } from '@fortawesome/free-solid-svg-icons'; // <-- Añadido faTags para el título de la página
import axios from 'axios';
import Swal from 'sweetalert2';

// Importa tus estilos personalizados para esta página
import '../styles/MarcasPage.css'; // <-- Nuevo archivo CSS

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
            text: "¡No podrás revertir esto! Si la marca tiene productos asociados, no podrá ser eliminada.", // <-- MENSAJE CLARO
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // <-- CAMBIADO: Rojo para eliminar
            cancelButtonColor: '#6c757d', // <-- CAMBIADO: Gris para cancelar
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
                    let errorMessage = 'Ocurrió un error al eliminar la marca.';
                    // <-- AÑADIDO: Manejo de error específico para restricción de clave foránea
                    if (err.response && err.response.status === 400) { // Bad Request, puede contener mensaje específico
                        const errorData = err.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'No es posible eliminar la marca porque tiene productos asociados.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('productos asociados') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'No es posible eliminar la marca porque tiene productos asociados.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (err.response && err.response.status === 409) { // Posible conflicto
                        errorMessage = 'No es posible eliminar la marca porque tiene productos asociados.';
                    } else if (err.message.includes('Network Error')) {
                        errorMessage = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
                    }
                    // <-- FIN AÑADIDO
                    setError(errorMessage);
                    Swal.fire('Error', errorMessage, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Función auxiliar para previsualizar la imagen (ACTUALIZADA)
    const renderImagePreview = (imageUrl, altText) => {
        if (!imageUrl) return null;
        // Validación básica de URL: asegúrate de que empieza con http/https
        const isValidUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

        return (
            <div className="mt-2 text-center image-preview-container"> {/* <-- Añadido clase */}
                <p className="mb-1 text-muted small" style={{color: '#000000'}}>Previsualización:</p> {/* <-- Color negro */}
                <Image
                    src={imageUrl}
                    alt={altText || "Previsualización"}
                    fluid
                    // Estilos inline reemplazados por clases CSS en MarcasPage.css
                    className="image-preview" // <-- Nueva clase
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x50/e0e0e0/555555?text=Img+No+Disp.'; }} // <-- Fallback mejorado
                />
            </div>
        );
    };

    return (
        <Container
            fluid // <-- Añadido: Para que ocupe todo el ancho
            className="marcas-page p-4" // <-- Añadido: Clase para estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faTags} className="me-3" /> Gestión de Marcas
            </h2>

            {error && <Alert variant="danger" className="text-center marcas-alert-error">{error}</Alert>} {/* <-- Añadido: Clase para estilo de alerta */}

            {/* Formulario para Agregar Nueva Marca */}
            <Card className="mb-4 shadow-sm marcas-card"> {/* <-- Añadido: Clase para estilo de tarjeta */}
                <Card.Header className="marcas-card-header-add"> {/* <-- Añadido: Clase para el header de la tarjeta */}
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
                                    <Form.Label style={{color: '#000000'}}>Nombre de la Marca</Form.Label> {/* <-- Añadido: Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={newMarcaData.nombre}
                                        onChange={handleNewMarcaChange}
                                        placeholder="Ej: Samsung, Apple, Oster"
                                        required
                                        className="form-control-light" // <-- Añadido: Clase de estilo
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newMarcaImagen">
                                    <Form.Label style={{color: '#000000'}}>URL de la Imagen (Logo)</Form.Label> {/* <-- Añadido: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faImage} /></InputGroup.Text> {/* <-- Añadido: Clase de estilo */}
                                        <Form.Control
                                            type="url" // Usa type="url" para validación básica del navegador
                                            name="imagen"
                                            value={newMarcaData.imagen}
                                            onChange={handleNewMarcaChange}
                                            placeholder="Ej: https://ejemplo.com/logo.png"
                                            className="form-control-light" // <-- Añadido: Clase de estilo
                                        />
                                    </InputGroup>
                                    {renderImagePreview(newMarcaData.imagen, newMarcaData.nombre)}
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-end">
                                <Button variant="success" type="submit" disabled={loading} className="btn-add-submit"> {/* <-- Añadido: Clase de estilo */}
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
            <Card className="shadow-sm marcas-card"> {/* <-- Añadido: Clase para estilo de tarjeta */}
                <Card.Header className="marcas-card-header-list"> {/* <-- Añadido: Clase para el header de la tarjeta */}
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Marcas Existentes
                    </h5>
                </Card.Header>
                <Card.Body>
                    {loading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* <-- Color del spinner */}
                                <span className="visually-hidden">Cargando marcas...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000'}}>Cargando marcas...</p> {/* <-- Color del texto */}
                        </div>
                    )}
                    {!loading && marcas.length === 0 && (
                        <Alert variant="info" className="text-center mt-3 marcas-alert-info"> {/* <-- Añadido: Clase para estilo de alerta */}
                            No hay marcas registradas aún.
                        </Alert>
                    )}
                    {!loading && marcas.length > 0 && (
                        <div className="table-responsive marcas-table-wrapper"> {/* <-- Añadido: Clase para estilo de tabla */}
                            <Table striped hover className="mt-3 marcas-table-light"> {/* <-- Añadido: Clase para estilo de tabla */}
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
                                                        className="marca-table-img" // <-- Nueva clase
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x25/e0e0e0/555555?text=No+Img'; }} // <-- Fallback mejorado
                                                    />
                                                ) : (
                                                    <span className="text-muted small" style={{color: '#000000'}}>No imagen</span>
                                                )}
                                            </td>
                                            <td>{marca.nombre}</td>
                                            <td className="text-center d-flex justify-content-center gap-2"> {/* <-- Añadido: Usar gap-2 para espacio */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="btn-action-edit" // <-- Añadido: Clase de estilo
                                                    onClick={() => handleEditClick(marca)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="btn-action-delete" // <-- Añadido: Clase de estilo
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
                <Modal.Header closeButton className="modal-header-light"> {/* <-- Añadido: Clase de estilo */}
                    <Modal.Title className="modal-title-light"> {/* <-- Añadido: Clase de estilo */}
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Editar Marca
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body className="modal-body-light"> {/* <-- Añadido: Clase de estilo */}
                        {currentMarca && (
                            <>
                                <Form.Group className="mb-3" controlId="editMarcaNombre">
                                    <Form.Label style={{color: '#000000'}}>Nombre de la Marca</Form.Label> {/* <-- Añadido: Color negro */}
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={editFormData.nombre}
                                        onChange={handleEditFormChange}
                                        required
                                        className="form-control-light" // <-- Añadido: Clase de estilo
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="editMarcaImagen">
                                    <Form.Label style={{color: '#000000'}}>URL de la Imagen (Logo)</Form.Label> {/* <-- Añadido: Color negro */}
                                    <InputGroup>
                                        <InputGroup.Text className="input-group-text-light"><FontAwesomeIcon icon={faImage} /></InputGroup.Text> {/* <-- Añadido: Clase de estilo */}
                                        <Form.Control
                                            type="url"
                                            name="imagen"
                                            value={editFormData.imagen}
                                            onChange={handleEditFormChange}
                                            placeholder="Ej: https://ejemplo.com/logo.png"
                                            className="form-control-light" // <-- Añadido: Clase de estilo
                                        />
                                    </InputGroup>
                                    {renderImagePreview(editFormData.imagen, editFormData.nombre)}
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="modal-footer-light"> {/* <-- Añadido: Clase de estilo */}
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} className="btn-close-modal"> {/* <-- Añadido: Clase de estilo */}
                            <FontAwesomeIcon icon={faTimes} className="me-2" />
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} className="btn-save-modal"> {/* <-- Añadido: Clase de estilo */}
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
