// web-client/src/pages/POSPage.js
import React, { useState, useEffect, useCallback} from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    InputGroup, Card, Modal, ListGroup, Alert // Asegúrate que Alert esté importado
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faTrash, faSearch, faTimes,
    faCheckCircle, faDollarSign,
    faEye, faTimesCircle,
    faCashRegister // Importar faCashRegister aquí
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

import Select from 'react-select';

// --- Importa tus estilos personalizados para POSPage ---
import '../styles/POSPage.css';

// CORRECCIÓN: Renombrado API_BASE_BASE_URL a API_BASE_URL si era un error de tipografía
const API_BASE_URL = 'http://localhost:8000/api'; 
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_CLIENTES_URL = `${API_BASE_URL}/clientes/`;
const API_FORMAS_PAGO_URL = `${API_BASE_URL}/formas_pago/`;
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios/`; // Asumiendo que este endpoint devuelve el usuario actual
const API_FACTURAS_URL = `${API_BASE_URL}/facturas/`;

const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = parseFloat(value); 
    if (isNaN(numValue)) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
};

const POSPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [currentSale, setCurrentSale] = useState({
        cliente: null,
        forma_pago: null,
        usuario: null,
        items: [],
        total: 0.00,
    });

    const [clientes, setClientes] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [facturas, setFacturas] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [showProductSearchModal, setShowProductSearchModal] = useState(false);
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [defaultUserId, setDefaultUserId] = useState(null);

    const fetchFacturas = useCallback(async () => {
        try {
            const response = await axios.get(`${API_FACTURAS_URL}?limit=5&ordering=-fecha`);
            setFacturas(response.data.results || []);
        } catch (err) {
            console.error('Error fetching invoices:', err.response ? err.response.data : err.message);
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                clientesRes,
                formasPagoRes,
                productosRes,
                usuariosRes
            ] = await Promise.all([
                axios.get(API_CLIENTES_URL),
                axios.get(API_FORMAS_PAGO_URL),
                axios.get(API_PRODUCTOS_URL),
                axios.get(API_USUARIOS_URL),
            ]);

            setClientes(clientesRes.data.map(client => ({ value: client.id, label: client.nombre })));
            setFormasPago(formasPagoRes.data.map(fp => ({ value: fp.id, label: fp.metodo })));
            setProductosDisponibles(productosRes.data);
            
            if (usuariosRes.data && usuariosRes.data.length > 0) {
                setDefaultUserId(usuariosRes.data[0].id);
                setCurrentSale(prev => ({ ...prev, usuario: usuariosRes.data[0].id }));
            } else {
                Swal.fire('Advertencia', 'No se encontraron usuarios. Por favor, crea al menos un usuario para poder crear facturas.', 'warning');
                setError('No hay usuarios disponibles para crear facturas.');
            }
            
            fetchFacturas(); 

        } catch (err) {
            console.error('Error fetching initial data:', err.response ? err.response.data : err.message);
            setError('Error al cargar datos iniciales.');
            Swal.fire('Error', 'No se pudieron cargar los datos necesarios para el POS.', 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchFacturas]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleSaleChange = (selectedOption, name) => {
        setCurrentSale(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : null }));
    };

    useEffect(() => {
        if (searchTerm) {
            const filtered = productosDisponibles.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.referencia_producto.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults(productosDisponibles);
        }
    }, [searchTerm, productosDisponibles]);

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenProductSearchModal = () => {
        setSearchTerm('');
        setSearchResults(productosDisponibles);
        setShowProductSearchModal(true);
    };

    const handleGoToClientsPage = () => {
        navigate('/clientes');
    };

    const handleAddProductToSale = (product) => {
        Swal.fire({
            title: `Añadir "${product.nombre}"`,
            html: `
                <div style="text-align: center;">
                    ${product.imagen ? `<img src="${product.imagen}" alt="${product.nombre}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">` : ''}
                    <p>Stock disponible: <strong>${product.stock}</strong></p>
                    <p>Precio Sugerido: <strong>${formatCurrency(product.precio_sugerido_venta)}</strong></p>
                    <input type="number" id="swal-quantity" class="swal2-input" placeholder="Cantidad" min="1" value="1" max="${product.stock}">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Añadir a Venta',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const quantity = parseInt(document.getElementById('swal-quantity').value, 10);
                if (isNaN(quantity) || quantity <= 0) {
                    Swal.showValidationMessage('Por favor, ingresa una cantidad válida.');
                    return false;
                }
                if (quantity > product.stock) {
                    Swal.showValidationMessage(`Cantidad excede el stock disponible (${product.stock}).`);
                    return false;
                }
                return quantity;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const quantity = result.value;
                const precioUnitario = parseFloat(product.precio_sugerido_venta);

                const existingItemIndex = currentSale.items.findIndex(item => item.producto_id === product.referencia_producto);

                let updatedItems;
                if (existingItemIndex > -1) {
                    const newQuantity = currentSale.items[existingItemIndex].cantidad + quantity;
                    if (newQuantity > product.stock) {
                        Swal.fire('Error', `La cantidad total para ${product.nombre} (${newQuantity}) excede el stock disponible (${product.stock}).`, 'error');
                        return;
                    }
                    updatedItems = currentSale.items.map((item, index) =>
                        index === existingItemIndex
                            ? { ...item, cantidad: newQuantity, precio_unitario: precioUnitario }
                            : item
                    );
                } else {
                    updatedItems = [
                        ...currentSale.items,
                        {
                            producto_id: product.referencia_producto,
                            nombre: product.nombre,
                            referencia_producto: product.referencia_producto,
                            cantidad: quantity,
                            precio_unitario: parseFloat(precioUnitario),
                            stock_disponible: product.stock,
                            imagen: product.imagen
                        }
                    ];
                }
                const newTotal = updatedItems.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario || 0)), 0);
                setCurrentSale(prev => ({ ...prev, items: updatedItems, total: newTotal }));
                setShowProductSearchModal(false);
                Swal.fire('¡Añadido!', `${quantity} x ${product.nombre} añadido a la factura con precio ${formatCurrency(precioUnitario)}.`, 'success');
            }
        });
    };

    const handleUpdateItemQuantity = (index, newQuantity) => {
        const itemToUpdate = currentSale.items[index];
        const productInStock = productosDisponibles.find(p => p.referencia_producto === itemToUpdate.producto_id);

        if (!productInStock) {
            Swal.fire('Error', 'Producto no encontrado en el stock disponible.', 'error');
            return;
        }

        if (isNaN(newQuantity) || newQuantity <= 0) {
            handleRemoveItem(index);
            return;
        }

        if (newQuantity > productInStock.stock) {
            Swal.fire('Error', `La cantidad (${newQuantity}) excede el stock disponible (${productInStock.stock}).`, 'error');
            return;
        }

        const updatedItems = currentSale.items.map((item, i) =>
            i === index ? { ...item, cantidad: newQuantity } : item
        );
        const newTotal = updatedItems.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario || 0)), 0);
        setCurrentSale(prev => ({ ...prev, items: updatedItems, total: newTotal }));
    };

    const handleRemoveItem = (indexToRemove) => {
        const updatedItems = currentSale.items.filter((_, index) => index !== indexToRemove);
        const newTotal = updatedItems.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario || 0)), 0);
        setCurrentSale(prev => ({ ...prev, items: updatedItems, total: newTotal }));
        Swal.fire('Eliminado', 'Producto retirado de la factura.', 'info');
    };

    const handleFinalizeSale = async () => {
        if (currentSale.items.length === 0) {
            Swal.fire('Advertencia', 'No hay productos en la factura.', 'warning');
            return;
        }
        if (!currentSale.cliente) {
            Swal.fire('Advertencia', 'Por favor, selecciona un cliente.', 'warning');
            return;
        }
        if (!currentSale.forma_pago) {
            Swal.fire('Advertencia', 'Por favor, selecciona una forma de pago.', 'warning');
            return;
        }
        if (!defaultUserId) {
            Swal.fire('Error', 'No se ha podido asignar un usuario a la venta. Recarga la página o contacta al administrador.', 'error');
            return;
        }

        try {
            setLoading(true);
            const saleData = {
                cliente: currentSale.cliente,
                forma_pago: currentSale.forma_pago,
                usuario: defaultUserId,
                detalle_ventas: currentSale.items.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                })),
                total: currentSale.total,
            };

            const response = await axios.post(API_FACTURAS_URL, saleData);
            Swal.fire('¡Éxito!', 'Venta registrada correctamente.', 'success');
            setCurrentSale({
                cliente: null,
                forma_pago: null,
                usuario: defaultUserId,
                items: [],
                total: 0.00,
            });
            fetchFacturas();
            fetchInitialData();
        } catch (error) {
            console.error('Error al finalizar la venta:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message;
            Swal.fire('Error', `Hubo un problema al registrar la venta: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateItemPrice = (indexToUpdate, newPrice) => {
        if (isNaN(newPrice) || newPrice < 0) {
            Swal.fire('Error', 'Por favor, ingresa un precio unitario válido.', 'error');
            return;
        }

        const updatedItems = currentSale.items.map((item, index) =>
            index === indexToUpdate ? { ...item, precio_unitario: newPrice } : item
        );
        const newTotal = updatedItems.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario || 0)), 0);
        setCurrentSale(prev => ({ ...prev, items: updatedItems, total: newTotal }));
    };

    const handleViewInvoiceDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceDetailsModal(true);
    };

    const handleCancelInvoice = async (invoiceId) => {
        Swal.fire({
            title: 'Anular factura y regresar stock?',
            text: "Esta acción no podra deshacerce.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, anular y regresar stock',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post(`${API_FACTURAS_URL}${invoiceId}/anular/`);
                    Swal.fire(
                        '¡Anulada!',
                        'La factura ha sido marcada como Anulada y el stock devuelto.',
                        'success'
                    );
                    fetchFacturas();
                    fetchInitialData();
                } catch (error) {
                    console.error('Error al anular la factura:', error);
                    Swal.fire(
                        'Error',
                        `No se pudo anular la factura: ${error.response?.data?.error || error.message}`,
                        'error'
                    );
                }
            }
        });
    };

    const handleCompleteInvoice = async (invoiceId) => {
        Swal.fire({
            title: '¿Completar Factura?',
            text: "Esta acción marcará la factura como completada.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Completar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post(`${API_FACTURAS_URL}${invoiceId}/completar/`);
                    Swal.fire(
                        '¡Completada!',
                        'La factura ha sido marcada como Completada.',
                        'success'
                    );
                    fetchFacturas();
                } catch (error) {
                    console.error('Error al completar la factura:', error);
                    Swal.fire(
                        'Error',
                        `No se pudo completar la factura: ${error.response?.data?.error || error.message}`,
                        'error'
                    );
                }
            }
        });
    };

    return (
        <Container 
            fluid
            className="pos-page p-4"
            // --- CAMBIO AQUÍ: Fondo blanco para toda la página ---
            style={{
                minHeight: 'calc(100vh - 56px)',
                backgroundColor: '#ffffff', // Fondo blanco
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}> {/* Título principal en negro */}
                <FontAwesomeIcon icon={faCashRegister} className="me-3" />
                Punto de Venta (POS)
            </h2>

            {error && <Alert variant="danger" className="text-center">{error}</Alert>}

            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" style={{ color: '#00b45c' }}>
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2" style={{ color: '#000000' }}>Cargando datos...</p> {/* Texto de carga en negro */}
                </div>
            )}

            {!loading && (
                <Row>
                    {/* Sección de Nueva Venta */}
                    <Col lg={7} className="mb-4">
                        <Card className="pos-card"
                            style={{
                                backgroundColor: '#f8f9fa', // Fondo blanco muy suave
                                borderColor: '#e0e0e0', // Borde gris suave
                                color: '#000000' // Texto negro por defecto en esta tarjeta
                            }}
                        >
                            <Card.Body>
                                <Card.Title className="pos-card-title-light">Nueva Venta</Card.Title> {/* Usar clase light */}
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Cliente</Form.Label> {/* Etiqueta en negro */}
                                        <Select
                                            options={clientes}
                                            value={clientes.find(c => c.value === currentSale.cliente)}
                                            onChange={(selectedOption) => handleSaleChange(selectedOption, 'cliente')}
                                            placeholder="Seleccionar Cliente"
                                            isClearable
                                            className="react-select-container-light" // Nueva clase para modo claro
                                            classNamePrefix="react-select"
                                        />
                                    </Form.Group>
                                    <Button variant="info" className="mb-3 btn-new-client" onClick={handleGoToClientsPage}>
                                        Crear Clientes
                                    </Button>

                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Forma de Pago</Form.Label> {/* Etiqueta en negro */}
                                        <Select
                                            options={formasPago}
                                            value={formasPago.find(fp => fp.value === currentSale.forma_pago)}
                                            onChange={(selectedOption) => handleSaleChange(selectedOption, 'forma_pago')}
                                            placeholder="Seleccionar Forma de Pago"
                                            isClearable
                                            className="react-select-container-light" // Nueva clase para modo claro
                                            classNamePrefix="react-select"
                                        />
                                    </Form.Group>

                                    <div className="table-responsive pos-table-wrapper">
                                        <Table striped hover size="sm" className="pos-items-table-light"> {/* Nueva clase para tabla clara */}
                                            <thead>
                                                <tr>
                                                    <th className="text-center">Imagen</th>
                                                    <th>Producto</th>
                                                    <th className="text-center">Cantidad</th>
                                                    <th className="text-center">Precio Unitario</th>
                                                    <th className="text-center">Subtotal</th>
                                                    <th className="text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentSale.items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-muted">No hay productos en la venta.</td>
                                                    </tr>
                                                ) : (
                                                    currentSale.items.map((item, index) => (
                                                        <tr key={item.producto_id}>
                                                            <td className="text-center">
                                                                {item.imagen && (
                                                                    <img
                                                                        src={item.imagen}
                                                                        alt={item.nombre}
                                                                        className="product-thumbnail-light" // Clase para estilo de imagen en modo claro
                                                                    />
                                                                )}
                                                            </td>
                                                            <td className="product-name-cell">{item.nombre}</td>
                                                            <td>
                                                                <InputGroup size="sm">
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="1"
                                                                        value={item.cantidad}
                                                                        onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value, 10))}
                                                                        className="table-input-light" // Clase para estilo de input en tabla clara
                                                                    />
                                                                </InputGroup>
                                                            </td>
                                                            <td>
                                                                <InputGroup size="sm">
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={item.precio_unitario.toFixed(2)}
                                                                        onChange={(e) => {
                                                                            const newPrice = parseFloat(e.target.value);
                                                                            handleUpdateItemPrice(index, isNaN(newPrice) ? 0 : newPrice);
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const val = parseFloat(e.target.value);
                                                                            if (isNaN(val)) {
                                                                                e.target.value = '0.00';
                                                                            } else {
                                                                                e.target.value = val.toFixed(2);
                                                                            }
                                                                        }}
                                                                        className="table-input-light" // Clase para estilo de input en tabla clara
                                                                    />
                                                                </InputGroup>
                                                            </td>
                                                            <td className="text-center">{formatCurrency(item.cantidad * item.precio_unitario)}</td>
                                                            <td className="text-center">
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                    className="btn-action-remove"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 pt-3 border-top" style={{borderColor: '#e0e0e0'}}> {/* Borde divisor claro */}
                                        <h4 className="mb-2 mb-md-0" style={{ color: '#00b45c' }}>Total: {formatCurrency(currentSale.total)}</h4>
                                        <div className="d-flex flex-wrap justify-content-end gap-2">
                                            <Button
                                                variant="success"
                                                onClick={handleFinalizeSale}
                                                disabled={currentSale.items.length === 0 || !currentSale.cliente || !currentSale.forma_pago}
                                                className="btn-finalize-sale"
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                                Finalizar Venta
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={handleOpenProductSearchModal}
                                                className="btn-add-product-light" // Nueva clase para este botón en modo claro
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                                Añadir Producto
                                            </Button>
                                        </div>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Sección de Historial de Facturas - También con fondo blanco */}
                    <Col lg={5}>
                        <Card
                            className="pos-card" // Usamos la misma clase para la tarjeta con fondo blanco
                            style={{
                                backgroundColor: '#f8f9fa', // Fondo blanco muy suave
                                borderColor: '#e0e0e0', // Borde gris suave
                                color: '#000000' // Texto negro por defecto en esta tarjeta
                            }}
                        >
                            <Card.Body>
                                <Card.Title className="pos-card-title-light">Historial de Últimas Facturas</Card.Title>
                                {facturas.length === 0 ? (
                                    <p className="text-center text-muted">No hay facturas recientes registradas.</p>
                                ) : (
                                    <div className="table-responsive pos-history-table-wrapper">
                                        <Table striped hover size="sm" className="pos-items-table-light"> {/* Usamos la misma clase de tabla clara */}
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Cliente</th>
                                                    <th>Total</th>
                                                    <th>Estado</th>
                                                    <th className="text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {facturas.map(factura => (
                                                    <tr key={factura.id}>
                                                        <td>{factura.id_factura}</td>
                                                        <td className="client-name-cell">{factura.cliente ? factura.cliente.nombre : 'N/A'}</td>
                                                        <td>{formatCurrency(factura.total)}</td>
                                                        <td>
                                                            <span className={`badge ${factura.estado === 'Completada' ?
                                                                'bg-success' : (factura.estado === 'Anulada' ? 'bg-secondary' : 'bg-danger')}`}>
                                                                {factura.estado}
                                                            </span>
                                                        </td>
                                                        <td className="text-center d-flex flex-wrap justify-content-center gap-1 pos-table-actions-cell">
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => handleViewInvoiceDetails(factura)}
                                                                className="btn-action-view"
                                                                title="Ver Detalles"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Button>
                                                            {factura.estado === 'Pendiente' && (
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() => handleCompleteInvoice(factura.id)}
                                                                    className="btn-action-complete"
                                                                    title="Completar Factura"
                                                                >
                                                                    <FontAwesomeIcon icon={faCheckCircle} />
                                                                </Button>
                                                            )}
                                                            {factura.estado !== 'Anulada' && (
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleCancelInvoice(factura.id)}
                                                                    className="btn-action-cancel"
                                                                    title="Anular Factura y Devolver Stock"
                                                                >
                                                                    <FontAwesomeIcon icon={faTimesCircle} />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Modal de Búsqueda de Producto */}
            <Modal show={showProductSearchModal} onHide={() => setShowProductSearchModal(false)} centered size="lg">
                <Modal.Header closeButton className="pos-modal-header-light"> {/* Nueva clase para modal header claro */}
                    <Modal.Title className="pos-modal-title-light"> {/* Nueva clase para modal title claro */}
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                        Buscar y Añadir Producto
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pos-modal-body-light"> {/* Nueva clase para modal body claro */}
                    <Form.Control
                        type="text"
                        placeholder="Buscar por nombre o referencia"
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        className="mb-3 pos-search-input-light" // Clase para estilo de input de búsqueda claro
                    />
                    <ListGroup className="pos-search-results-light"> {/* Nueva clase para resultados de búsqueda claros */}
                        {searchResults.length === 0 && searchTerm ? (
                            <ListGroup.Item disabled className="pos-search-item-empty-light">
                                No se encontraron productos con "{searchTerm}".
                            </ListGroup.Item>
                        ) : searchResults.length === 0 && !searchTerm ? (
                            <ListGroup.Item disabled className="pos-search-item-empty-light">
                                Escribe para buscar productos o ve la lista completa.
                            </ListGroup.Item>
                        ) : (
                            searchResults.map(product => (
                                <ListGroup.Item
                                    key={product.referencia_producto}
                                    action
                                    onClick={() => handleAddProductToSale(product)}
                                    className="d-flex justify-content-between align-items-center pos-search-item-light"
                                >
                                    <div className="d-flex align-items-center">
                                        {product.imagen && (
                                            <img
                                                src={product.imagen}
                                                alt={product.nombre}
                                                className="product-thumbnail-light me-2"
                                            />
                                        )}
                                        <div>
                                            <h5 className="mb-0" style={{color: '#000000'}}>{product.nombre}</h5> {/* Nombre del producto en negro */}
                                            <small className="text-muted" style={{color: '#6c757d'}}>{`Ref: ${product.referencia_producto} - Stock: ${product.stock}`}</small> {/* Texto pequeño en gris */}
                                        </div>
                                    </div>
                                    <Button variant="outline-success" size="sm" className="btn-add-search-result">
                                        Añadir
                                    </Button>
                                </ListGroup.Item>
                            ))
                        )}
                    </ListGroup>
                </Modal.Body>
            </Modal>

            {/* Modal de Detalles de Factura */}
            <Modal show={showInvoiceDetailsModal} onHide={() => setShowInvoiceDetailsModal(false)} centered size="lg">
                <Modal.Header closeButton className="pos-modal-header-light">
                    <Modal.Title className="pos-modal-title-light">Detalles de Factura</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pos-modal-body-light">
                    {selectedInvoice && (
                        <>
                            <Row className="mb-3 g-2">
                                <Col xs={12} md={6}>
                                    <strong style={{color: '#000000'}}>ID:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{selectedInvoice.id_factura}</span>
                                </Col>
                                <Col xs={12} md={6}>
                                    <strong style={{color: '#000000'}}>Fecha:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{new Date(selectedInvoice.fecha).toLocaleDateString()}</span>
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
                                    <strong style={{color: '#000000'}}>Usuario:</strong> <span className="text-muted" style={{color: '#6c757d'}}>{selectedInvoice.usuario?.username || 'N/A'}</span>
                                </Col>
                            </Row>
                            <h5 style={{ color: '#00b45c' }}>Productos</h5>
                            {selectedInvoice.detalle_ventas && selectedInvoice.detalle_ventas.length > 0 ? (
                                <div className="table-responsive pos-modal-table-wrapper">
                                    <Table striped hover size="sm" className="pos-items-table-light">
                                        <thead>
                                            <tr>
                                                <th className="text-center">Imagen</th>
                                                <th>Producto</th>
                                                <th className="text-center">Cantidad</th>
                                                <th className="text-center">Precio Unit.</th>
                                                <th className="text-center">Subtotal</th>
                                            </tr>
                                        </thead>
                                    <tbody>
                                        {selectedInvoice.detalle_ventas.map(detalle => (
                                            <tr key={detalle.id}>
                                                <td className="text-center">
                                                    {detalle.producto?.imagen && (
                                                        <img
                                                            src={detalle.producto.imagen}
                                                            alt={detalle.producto.nombre}
                                                            className="product-thumbnail-light"
                                                        />
                                                    )}
                                                </td>
                                                <td style={{color: '#000000'}}>{detalle.producto?.nombre}</td>
                                                <td style={{color: '#000000'}}>{detalle.cantidad}</td>
                                                <td style={{color: '#000000'}}>{formatCurrency(detalle.precio_unitario)}</td>
                                                <td style={{color: '#000000'}}>{formatCurrency(detalle.cantidad * detalle.precio_unitario)}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan="4" className="text-end" style={{ color: '#00b45c' }}><strong>Total:</strong></td>
                                            <td style={{ color: '#00b45c' }}><strong>{formatCurrency(selectedInvoice.total)}</strong></td>
                                        </tr>
                                    </tbody>
                                </Table>
                                </div>
                            ) : (
                                <p className="text-muted text-center" style={{color: '#6c757d'}}>No hay productos en esta factura.</p>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default POSPage;