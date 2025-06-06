// web-client/src/pages/FacturasPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faEye, faDollarSign, faTrash
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Container, Row, Col, Card, Form, InputGroup, Button, Table, Modal } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:8000/api';
const API_FACTURAS_URL = `${API_BASE_URL}/facturas/`;

const FacturasPage = () => {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Usado para ID o nombre de cliente
    const [searchDateStart, setSearchDateStart] = useState(null);
    const [searchDateEnd, setSearchDateEnd] = useState(null);
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // --- Funciones de Carga de Datos ---
    const fetchFacturas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();

            // <--- ¡CAMBIO AQUÍ! ENVÍA UN SOLO PARÁMETRO 'search'
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            // Filtrar por rango de fechas (estos filtros permanecen como antes)
            if (searchDateStart) {
                // Asegúrate de que la fecha se formateé correctamente al inicio del día para 'gte'
                params.append('fecha__gte', format(searchDateStart, "yyyy-MM-dd'T'00:00:00"));
            }
            if (searchDateEnd) {
                // Asegúrate de que la fecha se formateé correctamente al final del día para 'lte'
                params.append('fecha__lte', format(searchDateEnd, "yyyy-MM-dd'T'23:59:59"));
            }
            
            // Construir la URL completa con los parámetros
            const url = `${API_FACTURAS_URL}?${params.toString()}`;
            console.log("Fetching URL:", url); // <--- ¡Útil para depurar!

            const response = await axios.get(url);
            setFacturas(response.data);
        } catch (err) {
            console.error('Error fetching invoices:', err.response ? err.response.data : err.message);
            setError('Error al cargar las facturas.');
            Swal.fire('Error', `No se pudieron cargar el historial de facturas. Detalles: ${err.response?.data?.detail || err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, searchDateStart, searchDateEnd]);

    useEffect(() => {
        fetchFacturas();
    }, [fetchFacturas]);

    const handleSearch = () => {
        fetchFacturas();
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchDateStart(null);
        setSearchDateEnd(null);
    };

    const handleViewInvoiceDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceDetailsModal(true);
    };

    const handleDeleteInvoice = async (invoiceId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡Esta acción eliminará la factura permanentemente y devolverá el stock! ¡No se puede revertir!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Eliminar factura',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_FACTURAS_URL}${invoiceId}/`);
                    Swal.fire(
                        '¡Eliminada!',
                        'La factura ha sido eliminada y el stock devuelto.',
                        'success'
                    );
                    fetchFacturas();
                } catch (error) {
                    console.error('Error al eliminar la factura:', error);
                    Swal.fire(
                        'Error',
                        `No se pudo eliminar la factura: ${error.response?.data?.error || error.message}`,
                        'error'
                    );
                }
            }
        });
    };

    return (
        <Container fluid className="facturas-page p-3">
            <h2 className="mb-4">Historial de Facturas</h2>

            <Card className="mb-4">
                <Card.Header>Buscador de Facturas</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Buscar por ID o Cliente:</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Buscar por ID de factura o nombre de cliente"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                    />
                                    <Button variant="outline-secondary" onClick={handleSearch}>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fecha Desde:</Form.Label>
                                <DatePicker
                                    selected={searchDateStart}
                                    onChange={(date) => setSearchDateStart(date)}
                                    selectsStart
                                    startDate={searchDateStart}
                                    endDate={searchDateEnd}
                                    placeholderText="Fecha inicio"
                                    className="form-control"
                                    dateFormat="dd/MM/yyyy"
                                    isClearable
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fecha Hasta:</Form.Label>
                                <DatePicker
                                    selected={searchDateEnd}
                                    onChange={(date) => setSearchDateEnd(date)}
                                    selectsEnd
                                    startDate={searchDateStart}
                                    endDate={searchDateEnd}
                                    minDate={searchDateStart}
                                    placeholderText="Fecha fin"
                                    className="form-control"
                                    dateFormat="dd/MM/yyyy"
                                    isClearable
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={handleClearSearch} className="me-2">
                                Limpiar Filtros
                            </Button>
                            <Button variant="primary" onClick={handleSearch}>
                                <FontAwesomeIcon icon={faSearch} className="me-2" /> Buscar
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>Facturas</Card.Header>
                <Card.Body>
                    {loading ? (
                        <p>Cargando facturas...</p>
                    ) : error ? (
                        <p className="text-danger">{error}</p>
                    ) : facturas.length === 0 ? (
                        <p>No se encontraron facturas.</p>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>ID Factura</th>
                                        <th>Cliente</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Fecha</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facturas.map(factura => (
                                        <tr key={factura.id}>
                                            <td>{factura.id_factura}</td>
                                            <td>{factura.cliente ? factura.cliente.nombre : 'N/A'}</td>
                                            <td><FontAwesomeIcon icon={faDollarSign} /> {parseFloat(factura.total || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${factura.estado === 'Completada' ? 'bg-success' : (factura.estado === 'Anulada' ? 'bg-secondary' : 'bg-danger')}`}>
                                                    {factura.estado}
                                                </span>
                                            </td>
                                            <td>{new Date(factura.fecha).toLocaleString()}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="me-1"
                                                    onClick={() => handleViewInvoiceDetails(factura)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteInvoice(factura.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
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

            {/* Modal para ver detalles de la factura */}
            <Modal show={showInvoiceDetailsModal} onHide={() => setShowInvoiceDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Detalles de Factura #{selectedInvoice?.id_factura}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedInvoice && (
                        <>
                            <p><strong>Cliente:</strong> {selectedInvoice.cliente?.nombre || 'N/A'}</p>
                            <p><strong>Fecha:</strong> {new Date(selectedInvoice.fecha).toLocaleString()}</p>
                            <p><strong>Forma de Pago:</strong> {selectedInvoice.forma_pago?.metodo || 'N/A'}</p>
                            <p><strong>Estado:</strong> {selectedInvoice.estado}</p>
                            <p><strong>Usuario:</strong> {selectedInvoice.usuario?.username || 'N/A'}</p>
                            <h4 className="mt-4">Productos:</h4>
                            <Table striped bordered hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.detalle_ventas && selectedInvoice.detalle_ventas.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.producto?.nombre || 'N/A'}</td>
                                            <td>{item.cantidad}</td>
                                            <td><FontAwesomeIcon icon={faDollarSign} /> {parseFloat(item.precio_unitario || 0).toFixed(2)}</td>
                                            <td><FontAwesomeIcon icon={faDollarSign} /> {parseFloat(item.subtotal || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <h3 className="text-end mt-4">Total: <FontAwesomeIcon icon={faDollarSign} /> {parseFloat(selectedInvoice.total || 0).toFixed(2)}</h3>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowInvoiceDetailsModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default FacturasPage;