// web-client/src/pages/POSPage.js
import React, { useState, useEffect, useCallback} from 'react';
import {
    Container, Row, Col, Form, Button, Table, Spinner,
    InputGroup, Card, Modal, ListGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faTrash, faSearch, faTimes, // Removed faShoppingCart, faFileInvoice
    faCheckCircle, faDollarSign,
    faEye, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// Import react-select as it was missing and causing an error
import Select from 'react-select'; // <-- ADDED THIS IMPORT

const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_CLIENTES_URL = `${API_BASE_URL}/clientes/`;
const API_FORMAS_PAGO_URL = `${API_BASE_URL}/formas_pago/`;
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios/`; // Para obtener el usuario actual, si lo implementas
const API_FACTURAS_URL = `${API_BASE_URL}/facturas/`;

// Función de utilidad para formatear moneda
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    // Asegura que el valor sea un número antes de formatear
    const numValue = parseFloat(value); 
    if (isNaN(numValue)) return 'N/A';

    return new Intl.NumberFormat('es-CO', { // O 'es-ES', 'en-US' según tu región
        style: 'currency',
        currency: 'COP', // Cambia a tu moneda (ej: 'USD', 'EUR')
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
};

const POSPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Datos de la factura actual
    const [currentSale, setCurrentSale] = useState({
        cliente: null, // Cambiado a null para react-select
        forma_pago: null, // Cambiado a null para react-select
        usuario: null, // ID del usuario actual
        items: [], // [{ producto_id: 1, nombre: "Laptop", cantidad: 1, precio_unitario: 1200.00, stock_disponible: 5, imagen: "url" }]
        total: 0.00,
    });

    // Listas para selectores
    const [clientes, setClientes] = useState([]); // Raw data from API
    const [formasPago, setFormasPago] = useState([]); // Raw data from API
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    // Productos para buscar
    const [facturas, setFacturas] = useState([]); // Historial de facturas

    // Estado para la búsqueda de productos
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Modales
    const [showProductSearchModal, setShowProductSearchModal] = useState(false);
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Asume un usuario por defecto para las facturas (podrías cambiar esto con autenticación)
    const [defaultUserId, setDefaultUserId] = useState(null);

    // --- Carga de Facturas (esta es la que faltaba por separado) ---
    const fetchFacturas = useCallback(async () => {
        try {
            // SOLUCIÓN 1: Limitar a las últimas 5 facturas en el backend (Requiere paginación en DRF)
            // Asume que tu backend tiene configurado LimitOffsetPagination o PageNumberPagination
            // y que `ordering=-fecha` ordena por fecha descendente.
            const response = await axios.get(`${API_FACTURAS_URL}?limit=5&ordering=-fecha`);
            setFacturas(response.data.results || []); // Si la respuesta ya viene limitada, la usamos directamente
            // Si el backend no soporta ?limit=5 y te devuelve todas, usarías:
            // setFacturas(response.data.slice(0, 5));
        } catch (err) {
            console.error('Error fetching invoices:', err.response ? err.response.data : err.message);
            // No se usa Swal.fire aquí para evitar popups excesivos en caso de errores de carga de historial
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
                usuariosRes
            ] = await Promise.all([
                axios.get(API_CLIENTES_URL),
                axios.get(API_FORMAS_PAGO_URL),
                axios.get(API_PRODUCTOS_URL),
                axios.get(API_USUARIOS_URL),
            ]);

            // Formatear clientes y formas de pago para react-select
            setClientes(clientesRes.data.map(client => ({ value: client.id, label: client.nombre })));
            setFormasPago(formasPagoRes.data.map(fp => ({ value: fp.id, label: fp.metodo })));
            setProductosDisponibles(productosRes.data);
            
            // Asignar un usuario por defecto si hay alguno
            if (usuariosRes.data && usuariosRes.data.length > 0) {
                // Asume que la respuesta es un array y tomas el primer usuario
                setDefaultUserId(usuariosRes.data[0].id); // <-- CORRECCIÓN: Acceder al ID del primer objeto
                setCurrentSale(prev => ({ ...prev, usuario: usuariosRes.data[0].id }));
            } else {
                Swal.fire('Advertencia', 'No se encontraron usuarios. Por favor, crea al menos un usuario para poder crear facturas.', 'warning');
                setError('No hay usuarios disponibles para crear facturas.');
            }
            
            // Llama a fetchFacturas por separado, después de que los datos iniciales estén cargados
            // Esto asegura que `productosDisponibles` esté disponible si se necesita para los detalles de factura.
            fetchFacturas(); 

        } catch (err) {
            console.error('Error fetching initial data:', err.response ? err.response.data : err.message);
            setError('Error al cargar datos iniciales.');
            Swal.fire('Error', 'No se pudieron cargar los datos necesarios para el POS.', 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchFacturas]); // Dependencia de fetchFacturas

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // --- Manejadores de Formulario de Factura ---
    const handleSaleChange = (selectedOption, name) => {
        setCurrentSale(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : null }));
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
            // Muestra todos los productos si no hay término de búsqueda
            setSearchResults(productosDisponibles);
        }
    }, [searchTerm, productosDisponibles]);

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenProductSearchModal = () => {
        setSearchTerm('');
        setSearchResults(productosDisponibles); // Muestra todos al abrir el modal
        setShowProductSearchModal(true);
    };

    const handleGoToClientsPage = () => {
        navigate('/clientes'); // <-- Ajusta '/clientes' si tu ruta es diferente
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
        focusConfirm: false, // Mantén esto en false ya que controlaremos el foco manualmente si es necesario
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
        return quantity; // Ahora solo devuelve la cantidad
    }
    }).then((result) => {
        if (result.isConfirmed) {
            const quantity = result.value; // Ahora result.value es solo la cantidad
    const precioUnitario = parseFloat(product.precio_sugerido_venta); // <-- Tomamos el precio sugerido original

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
        // Aquí debes encontrar el producto real en `productosDisponibles` por su referencia_producto
        // ya que `itemToUpdate.producto_id` es la referencia_producto.
        const productInStock = productosDisponibles.find(p => p.referencia_producto === itemToUpdate.producto_id);

        if (!productInStock) {
            Swal.fire('Error', 'Producto no encontrado en el stock disponible.', 'error');
            return;
        }

        if (isNaN(newQuantity) || newQuantity <= 0) {
            // Si la cantidad es 0 o menos, eliminar el ítem
            handleRemoveItem(index);
            return;
        }

        if (newQuantity > productInStock.stock) {
            Swal.fire('Error', `La cantidad (${newQuantity}) excede el stock disponible (${productInStock.stock}).`, 'error');
            // Revertir la cantidad en el UI si es necesario
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
        if (currentSale.items.length === 0) {
            Swal.fire('Advertencia', 'No hay productos en la factura.', 'warning');
            return;
        }

        // Usar los valores seleccionados de react-select
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
                usuario: defaultUserId, // Usar el usuario por defecto
                detalle_ventas: currentSale.items.map(item => ({ // Cambiado 'items' a 'detalle_ventas' para el backend
                    producto_id: item.producto_id, // Usar el ID del producto
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                })),
                total: currentSale.total,
            };

            const response = await axios.post(API_FACTURAS_URL, saleData);
            Swal.fire('¡Éxito!', 'Venta registrada correctamente.', 'success');
            // Limpiar el estado de la venta actual
            setCurrentSale({
                cliente: null, // Resetear a null para react-select
                forma_pago: null, // Resetear a null para react-select
                usuario: defaultUserId,
                items: [],
                total: 0.00,
            });
            fetchFacturas(); // Recargar facturas para actualizar la lista de últimas facturas
            fetchInitialData(); // Para refrescar stock de productos
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

    // --- Historial de Facturas y Detalles ---
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
                    fetchFacturas(); // Vuelve a cargar las facturas para reflejar el cambio de estado
                    fetchInitialData(); // Para refrescar el stock de productos
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
            confirmButtonColor: '#28a745', // Green color for "Complete"
            cancelButtonColor: '#6c757d', // Grey color for "Cancel"
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
                <FontAwesomeIcon icon={faTimes} className="me-2" /> {/* Usé faTimes para evitar el warning */}
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
                        <Card>
                            <Card.Body>
                                <Card.Title>Nueva Venta</Card.Title>
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Cliente</Form.Label>
                                        {/* Usando react-select para el cliente */}
                                        <Select
                                            options={clientes}
                                            value={clientes.find(c => c.value === currentSale.cliente)}
                                            onChange={(selectedOption) => handleSaleChange(selectedOption, 'cliente')}
                                            placeholder="Seleccionar Cliente"
                                            isClearable
                                        />
                                    </Form.Group>
                                    <Button variant="info" className="mb-3" onClick={handleGoToClientsPage}>
                                        Crear Clientes
                                    </Button>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Forma de Pago</Form.Label>
                                        {/* Usando react-select para la forma de pago */}
                                        <Select
                                            options={formasPago}
                                            value={formasPago.find(fp => fp.value === currentSale.forma_pago)}
                                            onChange={(selectedOption) => handleSaleChange(selectedOption, 'forma_pago')}
                                            placeholder="Seleccionar Forma de Pago"
                                            isClearable
                                        />
                                    </Form.Group>

                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>Imagen</th> {/* AÑADIDO: Columna para imagen */}
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Precio Unitario</th>
                                                <th>Subtotal</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentSale.items.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center">No hay productos en la venta.</td>
                                                </tr>
                                            ) : (
                                                currentSale.items.map((item, index) => (
                                                    <tr key={item.producto_id}> {/* Usar producto_id como key */}
                                                        <td>
                                                            {item.imagen && ( // <-- AÑADIDO: Mostrar imagen
                                                                <img
                                                                    src={item.imagen}
                                                                    alt={item.nombre}
                                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '3px' }}
                                                                />
                                                            )}
                                                        </td>
                                                        <td>{item.nombre}</td>
                                                        <td>
                                                            <InputGroup>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.cantidad}
                                                                    onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value, 10))}
                                                                />
                                                            </InputGroup>
                                                        </td>
                                                        <td>
                                                            <InputGroup>
                                                                <Form.Control
                                                                    type="text" // Usamos 'text' para permitir entrada libre
                                                                    value={item.precio_unitario.toFixed(2)} // Mostrar con 2 decimales para edición
                                                                    onChange={(e) => {
                                                                        const newPrice = parseFloat(e.target.value);
                                                                        // Llama a una nueva función para actualizar el precio unitario del item
                                                                        handleUpdateItemPrice(index, isNaN(newPrice) ? 0 : newPrice);
                                                                    }}
                                                                    onBlur={(e) => { // Opcional: para formatear al salir del campo
                                                                        const val = parseFloat(e.target.value);
                                                                        if (isNaN(val)) {
                                                                            e.target.value = '0.00';
                                                                        } else {
                                                                            e.target.value = val.toFixed(2);
                                                                        }
                                                                    }}
                                                                />
                                                            </InputGroup>
                                                        </td>
                                                        <td>{formatCurrency(item.cantidad * item.precio_unitario)}</td>
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
                                                ))
                                            )}
                                        </tbody>
                                    </Table>

                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <h4>Total: {formatCurrency(currentSale.total)}</h4>
                                        <div>
                                            <Button
                                                variant="success"
                                                onClick={handleFinalizeSale}
                                                disabled={currentSale.items.length === 0 || !currentSale.cliente || !currentSale.forma_pago}
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" /> {/* Usé faCheckCircle */}
                                                Finalizar Venta
                                            </Button>
                                            <Button
                                                variant="primary"
                                                className="ms-2"
                                                onClick={handleOpenProductSearchModal}
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

                    {/* Sección de Historial de Facturas */}
                    <Col lg={5}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Historial de Últimas Facturas</Card.Title> {/* Título actualizado */}
                                {facturas.length === 0 ? (
                                    <p>No hay facturas recientes registradas.</p>
                                ) : (
                                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Cliente</th>
                                                    <th>Total</th>
                                                    <th>Estado</th>
                                                    <th className="text-center">Acciones</th> {/* Centrar encabezado */}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {facturas.map(factura => (
                                                    <tr key={factura.id}>
                                                        <td>{factura.id_factura}</td>
                                                        <td>{factura.cliente ? factura.cliente.nombre : 'N/A'}</td>
                                                        <td>{formatCurrency(factura.total)}</td>
                                                        <td>
                                                            <span className={`badge ${factura.estado === 'Completada' ?
                                                                'bg-success' : (factura.estado === 'Anulada' ? 'bg-secondary' : 'bg-danger')}`}>
                                                                {factura.estado}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                className="me-1"
                                                                onClick={() => handleViewInvoiceDetails(factura)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Button>
                                                            {factura.estado === 'Pendiente' && (
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    className="me-1"
                                                                    onClick={() => handleCompleteInvoice(factura.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faCheckCircle} />
                                                                </Button>
                                                            )}
                                                            {factura.estado !== 'Anulada' && (
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
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
                    <Form.Control
                        type="text"
                        placeholder="Buscar por nombre o referencia"
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        className="mb-3"
                    />
                    <ListGroup>
                        {searchResults.length === 0 && searchTerm ? (
                            <ListGroup.Item disabled>
                                No se encontraron productos con "{searchTerm}".
                            </ListGroup.Item>
                        ) : searchResults.length === 0 && !searchTerm ? (
                            <ListGroup.Item disabled>
                                Escribe para buscar productos o ve la lista completa.
                            </ListGroup.Item>
                        ) : (
                            searchResults.map(product => (
                                <ListGroup.Item
                                    key={product.referencia_producto} // Usar referencia_producto como key
                                    action
                                    onClick={() => handleAddProductToSale(product)}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <div className="d-flex align-items-center"> {/* CONTENEDOR PARA IMAGEN Y TEXTO */}
                                        {product.imagen && ( // <-- AÑADIDO: Mostrar imagen en la búsqueda
                                            <img
                                                src={product.imagen}
                                                alt={product.nombre}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '3px', marginRight: '10px' }}
                                            />
                                        )}
                                        <div>
                                            <h5>{product.nombre}</h5>
                                            <small>Ref: {product.referencia_producto} - Stock: {product.stock}</small>
                                        </div>
                                    </div>
                                    <Button variant="outline-success" size="sm">
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
                <Modal.Header closeButton>
                    <Modal.Title>Detalles de Factura</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedInvoice && (
                        <>
                            <Row>
                                <Col>
                                    <strong>ID:</strong> {selectedInvoice.id_factura}
                                </Col>
                                <Col>
                                    <strong>Fecha:</strong> {new Date(selectedInvoice.fecha).toLocaleDateString()}
                                </Col>
                            </Row>
                            <hr />
                            <Row>
                                <Col>
                                    <strong>Cliente:</strong> {selectedInvoice.cliente?.nombre || 'N/A'}
                                </Col>
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
                                            <th>Imagen</th> {/* AÑADIDO: Columna para imagen en detalles */}
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.detalle_ventas.map(detalle => (
                                            <tr key={detalle.id}>
                                                <td>
                                                    {detalle.producto?.imagen && ( // <-- AÑADIDO: Mostrar imagen en detalles
                                                        <img
                                                            src={detalle.producto.imagen}
                                                            alt={detalle.producto.nombre}
                                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '3px' }}
                                                        />
                                                    )}
                                                </td>
                                                <td>{detalle.producto?.nombre}</td>
                                                <td>{detalle.cantidad}</td>
                                                <td>{formatCurrency(detalle.precio_unitario)}</td>
                                                <td>{formatCurrency(detalle.cantidad * detalle.precio_unitario)}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan="4" className="text-end"><strong>Total:</strong></td> {/* Colspan ajustado */}
                                            <td><strong>{formatCurrency(selectedInvoice.total)}</strong></td>
                                        </tr>
                                    </tbody>
                                </Table>
                            ) : (
                                <p>No hay productos en esta factura.</p>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default POSPage;