// web-client/src/pages/POSPage.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    InputGroup, Card, Modal, ListGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faTrash, faShoppingCart, faFileInvoice, faSearch, faSave, faTimes,
    faUser, faMoneyBillWave, faBox, faCheckCircle, faEuroSign, faEdit, faMinusCircle, faDollarSign,
    faEye, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_CLIENTES_URL = `${API_BASE_URL}/clientes/`;
const API_FORMAS_PAGO_URL = `${API_BASE_URL}/formas_pago/`;
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios/`; // Para obtener el usuario actual, si lo implementas
const API_FACTURAS_URL = `${API_BASE_URL}/facturas/`;

const POSPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Datos de la factura actual
    const [currentSale, setCurrentSale] = useState({
        cliente: '', // ID del cliente
        forma_pago: '', // ID de la forma de pago
        usuario: '', // ID del usuario actual (podría ser fijo o del usuario logueado)
        items: [], // [{ producto_id: 1, nombre: "Laptop", cantidad: 1, precio_unitario: 1200.00, stock_disponible: 5 }]
        total: 0.00,
    });

    // Listas para selectores
    const [clientes, setClientes] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]); // Productos para buscar
    const [facturas, setFacturas] = useState([]); // Historial de facturas

    // Estado para la búsqueda de productos
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Modales
    const [showProductSearchModal, setShowProductSearchModal] = useState(false);
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Referencia al input de cantidad en el modal de búsqueda de productos
    const quantityInputRef = useRef(null);

    // Asume un usuario por defecto para las facturas (podrías cambiar esto con autenticación)
    const [defaultUserId, setDefaultUserId] = useState(null);

    // --- NUEVA FUNCIÓN: Carga de Facturas (esta es la que faltaba por separado) ---
    // Agrega esta función aquí, justo después de tus useState y antes de fetchInitialData
    const fetchFacturas = useCallback(async () => {
        try {
            const response = await axios.get(API_FACTURAS_URL);
            setFacturas(response.data);
        } catch (err) {
            console.error('Error fetching invoices:', err.response ? err.response.data : err.message);
            Swal.fire('Error', 'No se pudieron cargar el historial de facturas.', 'error');
        }
    }, []);

    // --- Carga Inicial de Datos ---
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                clientesRes,
                formasPagoRes,
                productosRes,
                usuariosRes, // Para obtener el ID del usuario por defecto
                facturasRes
            ] = await Promise.all([
                axios.get(API_CLIENTES_URL),
                axios.get(API_FORMAS_PAGO_URL),
                axios.get(API_PRODUCTOS_URL),
                axios.get(API_USUARIOS_URL),
                axios.get(API_FACTURAS_URL)
            ]);

            setClientes(clientesRes.data);
            setFormasPago(formasPagoRes.data);
            setProductosDisponibles(productosRes.data);
            setFacturas(facturasRes.data);

            // Asignar un usuario por defecto si hay alguno
            if (usuariosRes.data.length > 0) {
                setDefaultUserId(usuariosRes.data[0].id); // Usar el primer usuario encontrado
                setCurrentSale(prev => ({ ...prev, usuario: usuariosRes.data[0].id }));
            } else {
                Swal.fire('Advertencia', 'No se encontraron usuarios. Por favor, crea al menos un usuario para poder crear facturas.', 'warning');
                setError('No hay usuarios disponibles para crear facturas.');
            }

        } catch (err) {
            console.error('Error fetching initial data:', err.response ? err.response.data : err.message);
            setError('Error al cargar datos iniciales.');
            Swal.fire('Error', 'No se pudieron cargar los datos necesarios para el POS.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // --- Manejadores de Formulario de Factura ---
    const handleSaleChange = (e) => {
        const { name, value } = e.target;
        setCurrentSale(prev => ({ ...prev, [name]: value }));
    };

    // --- Búsqueda y Adición de Productos ---
    useEffect(() => {
        if (searchTerm) {
            const filtered = productosDisponibles.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.referencia_producto.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, productosDisponibles]);

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenProductSearchModal = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowProductSearchModal(true);
    };

    const handleAddProductToSale = (product) => {
        Swal.fire({
            title: `Añadir "${product.nombre}"`,
            html: `
                <p>Stock disponible: ${product.stock}</p>
                <input type="number" id="swal-quantity" class="swal2-input" placeholder="Cantidad" min="1" value="1">
            `,
            focusConfirm: false,
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
                const existingItemIndex = currentSale.items.findIndex(item => item.producto_id === product.referencia_producto);

                let updatedItems;
                if (existingItemIndex > -1) {
                    // Si el producto ya está, actualiza la cantidad
                    updatedItems = currentSale.items.map((item, index) =>
                        index === existingItemIndex
                            ? { ...item, cantidad: item.cantidad + quantity }
                            : item
                    );
                    // Validación de stock total si se añade más a un ítem existente
                    const totalQuantity = currentSale.items[existingItemIndex].cantidad + quantity;
                    if (totalQuantity > product.stock) {
                        Swal.fire('Error', `La cantidad total para ${product.nombre} (${totalQuantity}) excede el stock disponible (${product.stock}).`, 'error');
                        return;
                    }
                } else {
                    // Si es un producto nuevo, añádelo
                    updatedItems = [
                        ...currentSale.items,
                        {
                            producto_id: product.referencia_producto,
                            nombre: product.nombre,
                            referencia_producto: product.referencia_producto,
                            cantidad: quantity,
                            precio_unitario: parseFloat(product.precio_sugerido_venta), // Asume product.precio_sugerido_venta existe
                            stock_disponible: product.stock // Para referencia visual
                        }
                    ];
                }
                
                const newTotal = updatedItems.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario || 0)), 0);
                setCurrentSale(prev => ({ ...prev, items: updatedItems, total: newTotal }));
                setShowProductSearchModal(false); // Cerrar modal después de añadir
                Swal.fire('¡Añadido!', `${quantity} x ${product.nombre} añadido a la factura.`, 'success');
            }
        });
    };

    const handleUpdateItemQuantity = (index, newQuantity) => {
        const itemToUpdate = currentSale.items[index];
        const productInStock = productosDisponibles.find(p => p.id === itemToUpdate.producto_id);

        if (!productInStock) {
            Swal.fire('Error', 'Producto no encontrado en el stock disponible.', 'error');
            return;
        }

        if (newQuantity <= 0) {
            // Si la cantidad es 0 o menos, eliminar el ítem
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

    // --- Finalizar Venta ---
    const handleFinalizeSale = async () => {
        if (!currentSale.cliente || !currentSale.forma_pago) {
            Swal.fire('Advertencia', 'Por favor, selecciona un cliente y una forma de pago.', 'warning');
            return;
        }
        if (currentSale.items.length === 0) {
            Swal.fire('Advertencia', 'La factura no puede estar vacía. Añade al menos un producto.', 'warning');
            return;
        }
        if (!defaultUserId) {
             Swal.fire('Error', 'No hay un usuario asignado para crear la factura. Por favor, asegúrate de que haya al menos un usuario en el sistema.', 'error');
             return;
        }

        setLoading(true);
        setError(null);

        // Prepara los detalles de venta para el backend
        const detallesParaEnvio = currentSale.items.map(item => ({
            producto_id: item.producto_id, // Usamos producto_id para el backend
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            // subtotal no se envía, el backend lo calcula
        }));

        const facturaPayload = {
            cliente: parseInt(currentSale.cliente, 10),
            forma_pago: parseInt(currentSale.forma_pago, 10),
            usuario: defaultUserId, // Asigna el usuario por defecto
            total: currentSale.total, // El backend lo recalculará, pero lo enviamos por si acaso
            estado: 'Completada', // O el estado inicial que desees
            detalle_ventas: detallesParaEnvio,
        };

        try {
            const response = await axios.post(API_FACTURAS_URL, facturaPayload);
            if (response.status === 201) {
                Swal.fire('¡Venta Exitosa!', `Factura #${response.data.id_factura} creada.`, 'success');
                // Reiniciar la venta actual
                setCurrentSale({
                    cliente: '',
                    forma_pago: '',
                    usuario: defaultUserId,
                    items: [],
                    total: 0.00,
                });
                fetchInitialData(); // Recargar facturas y productos para ver los cambios de stock
            }
        } catch (err) {
            console.error('Error al finalizar la venta:', err.response ? err.response.data : err);
            let errorMessage = 'Ocurrió un error al finalizar la venta.';
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'object') {
                    errorMessage = Object.values(err.response.data).flat().join(' ');
                } else {
                    errorMessage = err.response.data;
                }
            }
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Historial de Facturas ---
    const handleViewInvoiceDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceDetailsModal(true);
    };

    const handleCancelInvoice = async (invoiceId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡Esto anulará la factura y devolverá el stock de los productos!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, anularla!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                setError(null);
                try {
                    // Llama a la acción personalizada 'anular' en el ViewSet
                    const response = await axios.post(`${API_FACTURAS_URL}${invoiceId}/anular/`);
                    if (response.status === 200) {
                        Swal.fire('¡Anulada!', response.data.detail || 'La factura ha sido anulada y el stock devuelto.', 'success');
                        fetchInitialData(); // Recargar facturas y productos
                    }
                } catch (err) {
                    console.error('Error al anular la factura:', err.response ? err.response.data : err);
                    const errorMessage = err.response && err.response.data && err.response.data.detail
                        ? err.response.data.detail
                        : 'Ocurrió un error al anular la factura.';
                    setError(errorMessage);
                    Swal.fire('Error', errorMessage, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleCompleteInvoice = async (invoiceId) => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¡Esta acción marcará la factura como Completada y no se podrá revertir fácilmente!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745', // Verde para "Completar"
        cancelButtonColor: '#dc3545', // Rojo para "Cancelar"
        confirmButtonText: 'Sí, Completar factura',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Llama al nuevo endpoint del backend
                await axios.post(`${API_FACTURAS_URL}${invoiceId}/completar/`);
                Swal.fire(
                    '¡Completada!',
                    'La factura ha sido marcada como Completada.',
                    'success'
                );
                fetchFacturas(); // Vuelve a cargar las facturas para reflejar el cambio de estado
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

    // --- Renderizado ---
    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                Punto de Venta (POS)
            </h2>

            {error && <div className="alert alert-danger text-center">{error}</div>}

            {loading && (
                <div className="text-center my-3">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2">Cargando datos...</p>
                </div>
            )}

            {!loading && (
                <Row>
                    {/* Sección de Nueva Venta */}
                    <Col lg={7} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">
                                    <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                                    Nueva Factura
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Form>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group controlId="selectCliente">
                                                <Form.Label>Cliente</Form.Label>
                                                <InputGroup>
                                                    <InputGroup.Text><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                                    <Form.Select
                                                        name="cliente"
                                                        value={currentSale.cliente}
                                                        onChange={handleSaleChange}
                                                        required
                                                    >
                                                        <option value="">Selecciona Cliente</option>
                                                        {clientes.map(c => (
                                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                                        ))}
                                                    </Form.Select>
                                                </InputGroup>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="selectFormaPago">
                                                <Form.Label>Forma de Pago</Form.Label>
                                                <InputGroup>
                                                    <InputGroup.Text><FontAwesomeIcon icon={faMoneyBillWave} /></InputGroup.Text>
                                                    <Form.Select
                                                        name="forma_pago"
                                                        value={currentSale.forma_pago}
                                                        onChange={handleSaleChange}
                                                        required
                                                    >
                                                        <option value="">Selecciona Forma de Pago</option>
                                                        {formasPago.map(fp => (
                                                            <option key={fp.id} value={fp.id}>{fp.metodo}</option>
                                                        ))}
                                                    </Form.Select>
                                                </InputGroup>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Button
                                        variant="info"
                                        className="mb-3"
                                        onClick={handleOpenProductSearchModal}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                        Añadir Producto
                                    </Button>

                                    <h5>Detalles de la Venta</h5>
                                    {currentSale.items.length === 0 ? (
                                        <div className="alert alert-info text-center">
                                            No hay productos en esta factura.
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table striped bordered hover size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Producto</th>
                                                        <th>Cantidad</th>
                                                        <th>Precio Unit.</th>
                                                        <th>Subtotal</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentSale.items.map((item, index) => (
                                                        <tr key={item.producto_id}>
                                                            <td>{item.nombre} <br/> <small className="text-muted">({item.referencia_producto})</small></td>
                                                            <td>
                                                                <InputGroup size="sm">
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="1"
                                                                        value={item.cantidad}
                                                                        onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value, 10))}
                                                                        style={{ width: '70px' }}
                                                                    />
                                                                </InputGroup>
                                                            </td>
                                                            <td>${item.precio_unitario.toFixed(2)}</td>
                                                            <td>${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                                                            <td className="text-center">
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveItem(index)}
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

                                    <h4 className="text-end mt-4">
                                        Total: <FontAwesomeIcon icon={faDollarSign} /> {currentSale.total.toFixed(2)}
                                    </h4>

                                    <div className="d-grid mt-3">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleFinalizeSale}
                                            disabled={loading || currentSale.items.length === 0 || !currentSale.cliente || !currentSale.forma_pago}
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                            Finalizar Venta
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Sección de Historial de Facturas */}
                    <Col lg={5}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-secondary text-white">
                                <h5 className="mb-0">
                                    <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                                    Historial de Facturas
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                {facturas.length === 0 ? (
                                    <div className="alert alert-info text-center">
                                        No hay facturas registradas.
                                    </div>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Factura #</th>
                                                    <th>Cliente</th>
                                                    <th>Total</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
<tbody>
    {facturas.map(factura => (
        <tr key={factura.id}>
            <td>{factura.id_factura}</td>
            <td>{factura.cliente ? factura.cliente.nombre : 'N/A'}</td>
            {/* Added FontAwesomeIcon for consistency with other dollar signs */}
            <td><FontAwesomeIcon icon={faDollarSign} /> {parseFloat(factura.total || 0).toFixed(2)}</td>
            <td>
                <span className={`badge ${factura.estado === 'Completada' ? 'bg-success' : 'bg-danger'}`}>
                    {factura.estado}
                </span>
            </td>
            <td className="text-center">
                {/* Button to View Invoice Details */}
                <Button
                    variant="primary"
                    size="sm"
                    className="me-1" // Added margin-right for spacing
                    onClick={() => handleViewInvoiceDetails(factura)}
                >
                    <FontAwesomeIcon icon={faEye} />
                </Button>

                {/* --- NEW BUTTON: Complete Invoice --- */}
                {/* This button only appears if the invoice state is 'Pendiente' */}
                {factura.estado === 'Pendiente' && (
                    <Button
                        variant="success" // Green color for "Complete" action
                        size="sm"
                        className="me-1" // Added margin-right for spacing
                        onClick={() => handleCompleteInvoice(factura.id)} // Call the new handler
                    >
                        <FontAwesomeIcon icon={faCheckCircle} /> {/* Checkmark icon */}
                    </Button>
                )}
                {/* --- END NEW BUTTON --- */}

                {/* Button to Cancel/Annul Invoice (only if not already 'Anulada') */}
                {factura.estado !== 'Anulada' && (
                    <Button
                        variant="danger"
                        size="sm"
                        // Removed className="ms-2" if you prefer `me-1` on all buttons for consistent spacing
                        onClick={() => handleCancelInvoice(factura.id)}
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
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                        Buscar y Añadir Producto
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputGroup className="mb-3">
                        <InputGroup.Text><FontAwesomeIcon icon={faSearch} /></InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Buscar por nombre o referencia..."
                            value={searchTerm}
                            onChange={handleSearchTermChange}
                        />
                    </InputGroup>
                    <ListGroup>
                        {searchResults.length === 0 && searchTerm ? (
                            <ListGroup.Item className="text-center text-muted">
                                No se encontraron productos.
                            </ListGroup.Item>
                        ) : (
                            searchResults.map(product => (
                                <ListGroup.Item
                                    key={product.referencia_producto}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <div>
                                        <strong>{product.nombre}</strong> ({product.referencia_producto})
                                        <br />
                                        <small className="text-muted">Stock: {product.stock} | Precio: ${parseFloat(product.precio_sugerido_venta).toFixed(2)}</small>
                                    </div>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleAddProductToSale(product)}
                                        disabled={product.stock <= 0}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="me-1" />
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
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                        Detalles de Factura #{selectedInvoice?.id_factura}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedInvoice && (
                        <>
                            <Row className="mb-3">
                                <Col>
                                    <strong>Cliente:</strong> {selectedInvoice.cliente?.nombre || 'N/A'}
                                </Col>
                                <Col>
                                    <strong>Fecha:</strong> {new Date(selectedInvoice.fecha).toLocaleString()}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    <strong>Forma de Pago:</strong> {selectedInvoice.forma_pago?.metodo || 'N/A'}
                                </Col>
                                <Col>
                                    <strong>Usuario:</strong> {selectedInvoice.usuario?.username || 'N/A'}
                                </Col>
                            </Row>
                            <hr />
                            <h5>Productos</h5>
                            {selectedInvoice.detalle_ventas && selectedInvoice.detalle_ventas.length > 0 ? (
                                <Table striped bordered hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.detalle_ventas.map(detalle => (
                                            <tr key={detalle.id}>
                                                <td>{detalle.producto?.nombre || 'N/A'} ({detalle.producto?.referencia_producto || 'N/A'})</td>
                                                <td>{detalle.cantidad}</td>
                                                <td>${parseFloat(detalle.precio_unitario || 0).toFixed(2)}</td>
                                                <td>${parseFloat(detalle.subtotal || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p>No hay detalles de productos para esta factura.</p>
                            )}
                            <h4 className="text-end mt-3">
                                Total de Factura: <FontAwesomeIcon icon={faDollarSign} />{' '} {/* Changed to faDollarSign for COP */}
                                {parseFloat(selectedInvoice.total || 0).toFixed(2)} {/* <--- Apply parseFloat() here! */}
                            </h4>
                            <p className="text-end">
                                <span className={`badge ${selectedInvoice.estado === 'Completada' ? 'bg-success' : 'bg-danger'}`}>
                                    Estado: {selectedInvoice.estado}
                                </span>
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowInvoiceDetailsModal(false)}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default POSPage;