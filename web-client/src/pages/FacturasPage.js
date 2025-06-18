// web-client/src/pages/FacturasPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEye, faDollarSign, faTrash, faFileInvoice // Añadido faFileInvoice para el título
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Container, Row, Col, Card, Form, InputGroup, Button, Table, Modal, Spinner, Alert } from 'react-bootstrap'; // Añadido Spinner y Alert
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

// Importa tus estilos personalizados para esta página
import '../styles/FacturasPage.css';

const API_BASE_URL = 'http://localhost:8000/api';
const API_FACTURAS_URL = `${API_BASE_URL}/facturas/`;

// Función de utilidad para formatear moneda (Copiada de POSPage.js para consistencia)
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'N/A';

    return new Intl.NumberFormat('es-CO', { // Ajusta la configuración regional si es necesario
        style: 'currency',
        currency: 'COP', // Cambia a tu moneda (ej: 'USD', 'EUR')
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
};


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
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (searchDateStart) {
        params.append('fecha__gte', format(searchDateStart, "yyyy-MM-dd'T'00:00:00"));
      }
      if (searchDateEnd) {
        params.append('fecha__lte', format(searchDateEnd, "yyyy-MM-dd'T'23:59:59"));
      }

      const url = `${API_FACTURAS_URL}?${params.toString()}`;
      console.log("Fetching URL:", url);
      const response = await axios.get(url);
      
      setFacturas(response.data.results || []); 

    } catch (err) {
      console.error('Error fetching invoices:', err.response ? err.response.data : err.message);
      setError('Error al cargar las facturas.');
      Swal.fire('Error', `No se pudieron cargar el historial de facturas. Detalles: ${err.response?.data?.detail || err.message}`, 'error');
      setFacturas([]);
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
    <Container 
        fluid 
        className="facturas-page p-4"
        style={{
            minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
            backgroundColor: '#ffffff', // Fondo blanco para la página
            color: '#000000' // Texto negro por defecto
        }}
    >
      <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
        <FontAwesomeIcon icon={faFileInvoice} className="me-3" /> Historial de Facturas
      </h2>

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      <Card className="facturas-card mb-4">
        <Card.Header className="facturas-card-header">Buscador de Facturas</Card.Header>
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
                    className="form-control-light" // Clase para input claro
                  />
                  <Button variant="outline-secondary" onClick={handleSearch} className="btn-search">
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
                  className="form-control form-control-light" // Clases para input claro
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  wrapperClassName="date-picker-wrapper" // Para aplicar estilos al wrapper
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
                  className="form-control form-control-light" // Clases para input claro
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  wrapperClassName="date-picker-wrapper" // Para aplicar estilos al wrapper
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col className="d-flex justify-content-end gap-2"> {/* gap-2 para espacio entre botones */}
              <Button variant="secondary" onClick={handleClearSearch} className="btn-clear-filters">
                Limpiar Filtros
              </Button>
              <Button variant="primary" onClick={handleSearch} className="btn-search-main">
                <FontAwesomeIcon icon={faSearch} className="me-2" /> Buscar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="facturas-card">
        <Card.Header className="facturas-card-header">Facturas</Card.Header>
        <Card.Body>
          {loading ?
          (
            <div className="text-center my-5">
                <Spinner animation="border" role="status" style={{ color: '#00b45c' }}>
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-2" style={{ color: '#000000' }}>Cargando facturas...</p>
            </div>
          ) : error ?
          (
            <p className="text-danger text-center">{error}</p>
          ) : facturas.length === 0 ?
          (
            <p className="text-muted text-center">No se encontraron facturas.</p>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="facturas-table-light"> {/* Nueva clase para tabla clara */}
                <thead>
                  <tr>
                    <th>ID Factura</th>
                    <th>Cliente</th>
                    <th className="text-end">Total</th> {/* Alineado a la derecha */}
                    <th className="text-center">Estado</th> {/* Centrado */}
                    <th>Fecha</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(factura => (
                    <tr key={factura.id}>
                      <td>{factura.id_factura}</td>
                      <td className="client-name-cell">{factura.cliente ? factura.cliente.nombre : 'N/A'}</td>
                      <td className="text-end">{formatCurrency(factura.total)}</td> {/* Formateado y alineado */}
                      <td className="text-center">
                        <span className={`badge ${factura.estado === 'Completada' ?
                        'bg-success' : (factura.estado === 'Anulada' ? 'bg-danger' : 'bg-warning')}`}> {/* Usar bg-warning para Pendiente */}
                          {factura.estado}
                        </span>
                      </td>
                      <td>{new Date(factura.fecha).toLocaleString()}</td>
                      <td className="text-center d-flex flex-wrap justify-content-center gap-1"> {/* Compacto y apilable */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewInvoiceDetails(factura)}
                          className="btn-action-view"
                          title="Ver Detalles"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteInvoice(factura.id)}
                          className="btn-action-delete"
                          title="Eliminar Factura"
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
      <Modal show={showInvoiceDetailsModal} onHide={() => setShowInvoiceDetailsModal(false)} size="lg" centered> {/* Añadido centered */}
        <Modal.Header closeButton className="facturas-modal-header">
          <Modal.Title className="facturas-modal-title">Detalles de Factura #{selectedInvoice?.id_factura}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="facturas-modal-body">
          {selectedInvoice && (
            <>
              <Row className="mb-3 g-2">
                  <Col xs={12} md={6}>
                      <strong style={{color: '#000000'}}>ID:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{selectedInvoice.id_factura}</span>
                  </Col>
                  <Col xs={12} md={6}>
                      <strong style={{color: '#000000'}}>Fecha:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{new Date(selectedInvoice.fecha).toLocaleString()}</span>
                  </Col>
              </Row>
              <hr style={{ borderColor: '#e0e0e0' }} />
              <Row className="mb-4 g-2">
                  <Col xs={12} md={4}>
                      <strong style={{color: '#000000'}}>Cliente:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{selectedInvoice.cliente?.nombre || 'N/A'}</span>
                  </Col>
                  <Col xs={12} md={4}>
                      <strong style={{color: '#000000'}}>Forma de Pago:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{selectedInvoice.forma_pago?.metodo || 'N/A'}</span>
                  </Col>
                  <Col xs={12} md={4}>
                      <strong style={{color: '#000000'}}>Estado:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{selectedInvoice.estado}</span>
                  </Col>
              </Row>
              <h5 style={{ color: '#00b45c' }}>Productos:</h5>
              {selectedInvoice.detalle_ventas && selectedInvoice.detalle_ventas.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover size="sm" className="facturas-modal-table-light"> {/* Nueva clase para tabla clara en modal */}
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-end">Cantidad</th>
                        <th className="text-end">Precio Unitario</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.detalle_ventas.map(item => (
                        <tr key={item.id}>
                          <td>{item.producto?.nombre || 'N/A'}</td>
                          <td className="text-end">{item.cantidad}</td>
                          <td className="text-end">{formatCurrency(item.precio_unitario)}</td>
                          <td className="text-end">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted text-center" style={{color: '#6c757d'}}>No hay productos en esta factura.</p>
              )}
              <h3 className="text-end mt-4" style={{ color: '#00b45c' }}>Total: {formatCurrency(selectedInvoice.total)}</h3>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="facturas-modal-footer">
          <Button variant="secondary" onClick={() => setShowInvoiceDetailsModal(false)} className="btn-close-modal">
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
export default FacturasPage;