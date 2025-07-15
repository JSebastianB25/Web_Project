// web-client/src/pages/EditarEliminarProductosPage.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Container,
    Form,
    Button,
    Row,
    Col,
    Card,
    Modal,
    InputGroup,
    Spinner,
    Alert
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faTimes, faBoxOpen, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Importa tus estilos personalizados para esta página
import '../styles/EditarProductosPage.css';

// URL base de tu API de productos
const API_PRODUCTOS_URL = 'http://localhost:8000/api/productos/';
const API_CATEGORIAS_URL = 'http://localhost:8000/api/categorias/';
const API_PROVEEDORES_URL = 'http://localhost:8000/api/proveedores/';
const API_MARCAS_URL = 'http://localhost:8000/api/marcas/';

// --- FUNCIONES PARA MANEJO DE NÚMEROS CON SEPARADORES ---
// Formatea un número para mostrarlo en un input de texto (con separadores de miles y coma decimal)
const formatInputNumber = (value, isInteger = false) => {
    console.log('formatInputNumber - Valor de entrada:', value, 'Tipo:', typeof value);
    if (value === null || value === undefined || value === '') return '';

    let numValue;
    if (typeof value === 'string') {
        // Si la cadena contiene una coma, asumimos que es un número ingresado por el usuario
        // con coma decimal y punto como separador de miles.
        if (value.includes(',')) {
            numValue = parseFloat(value.replace(/\./g, '').replace(/,/g, '.'));
        } else {
            // Si no contiene coma, asumimos que es un número de la API con punto decimal.
            // No eliminamos los puntos, parseFloat lo manejará correctamente.
            numValue = parseFloat(value);
        }
    } else {
        // Si ya es un número, simplemente lo parseamos a flotante.
        numValue = parseFloat(value);
    }

    console.log('formatInputNumber - Valor numérico procesado:', numValue);

    if (isNaN(numValue)) return ''; // Si no es un número válido, devuelve cadena vacía

    const options = {
        minimumFractionDigits: isInteger ? 0 : 2, // 0 para enteros, 2 para decimales por defecto
        maximumFractionDigits: isInteger ? 0 : 2, // 0 para enteros, 2 para decimales por defecto
        useGrouping: true // Habilitar separadores de miles
    };

    // Si es un número entero y no es un campo entero (como precio), forzar 2 decimales (ej. 100 -> 100,00)
    if (!isInteger && numValue % 1 === 0) {
        options.minimumFractionDigits = 2;
    }

    const formattedValue = numValue.toLocaleString('es-CO', options);
    console.log('formatInputNumber - Valor formateado final:', formattedValue);
    return formattedValue;
};

// Parsea un string formateado de input a un número (eliminando separadores de miles y cambiando coma a punto)
const parseInputNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    // Eliminar separadores de miles (puntos) y reemplazar coma decimal con punto
    const cleanedValue = String(value).replace(/\./g, '').replace(/,/g, '.');
    return cleanedValue; // Devuelve el string limpio, se convertirá a número en onBlur o handleSubmit
};
// --- FIN FUNCIONES DE NÚMEROS ---


const EditarEliminarProductosPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [editFormData, setEditFormData] = useState({
        referencia_producto: '',
        nombre: '',
        marca: '',
        precio_costo: '',
        precio_sugerido_venta: '',
        stock: '',
        proveedor: '',
        categoria: '',
        imagen: '',
        activo: true,
    });

    const [displayPrecioCosto, setDisplayPrecioCosto] = useState('');
    const [displayPrecioSugeridoVenta, setDisplayPrecioSugeridoVenta] = useState('');
    const [displayStock, setDisplayStock] = useState('');

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const [categories, setCategories] = useState([]);
    const [providers, setProviders] = useState([]);
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        const fetchRelatedData = async () => {
            setPageLoading(true);
            try {
                const [categoriesRes, providersRes, brandsRes] = await Promise.all([
                    axios.get(API_CATEGORIAS_URL),
                    axios.get(API_PROVEEDORES_URL),
                    axios.get(API_MARCAS_URL),
                ]);
                setCategories(categoriesRes.data);
                setProviders(providersRes.data);
                setBrands(brandsRes.data);
            } catch (error) {
                console.error('Error al cargar categorías, proveedores o marcas:', error);
                Swal.fire('Error de Carga', 'No se pudieron cargar las listas de categorías, proveedores o marcas.', 'error');
            } finally {
                setPageLoading(false);
            }
        };
        fetchRelatedData();
    }, []);

    const handleSearch = useCallback(async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSearchPerformed(true);
        setSelectedProduct(null);
        setSearchResults([]);

        try {
            const response = await axios.get(`${API_PRODUCTOS_URL}?search=${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error al buscar productos:', error);
            Swal.fire('Error de Búsqueda', 'Hubo un problema al buscar productos. Inténtalo de nuevo.', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (searchQuery === '') {
            handleSearch({ preventDefault: () => {} });
        }
    }, [handleSearch, searchQuery]);

    // Función para seleccionar un producto y abrir el modal de edición
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        console.log('Datos del producto recibidos de la API (en handleSelectProduct):', product);

        // Inicializa editFormData con los valores numéricos reales
        // Aseguramos que sean números para el estado interno.
        // parseFloat ya maneja el punto como decimal si no hay otros símbolos.
        setEditFormData({
            referencia_producto: product.referencia_producto || '',
            nombre: product.nombre || '',
            marca: product.marca && typeof product.marca === 'object' && product.marca.id ? String(product.marca.id) : (product.marca ? String(product.marca) : ''),
            precio_costo: parseFloat(product.precio_costo),
            precio_sugerido_venta: parseFloat(product.precio_sugerido_venta),
            stock: parseInt(product.stock),
            proveedor: product.proveedor && typeof product.proveedor === 'object' && product.proveedor.id ? String(product.proveedor.id) : (product.proveedor ? String(product.proveedor) : ''),
            categoria: product.categoria && typeof product.categoria === 'object' && product.categoria.id ? String(product.categoria.id) : (product.categoria ? String(product.categoria) : ''),
            imagen: product.imagen || '',
            activo: true,
        });

        // Inicializa los estados de visualización con los valores formateados
        setDisplayPrecioCosto(formatInputNumber(product.precio_costo));
        setDisplayPrecioSugeridoVenta(formatInputNumber(product.precio_sugerido_venta));
        setDisplayStock(formatInputNumber(product.stock, true));

        setShowEditModal(true);
    };

    // Maneja los cambios en los campos del formulario del modal de edición
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setEditFormData(prevData => ({
                ...prevData,
                [name]: checked,
            }));
        } else if (name === 'precio_costo') {
            setDisplayPrecioCosto(value); // Actualiza solo el estado de visualización
        } else if (name === 'precio_sugerido_venta') {
            setDisplayPrecioSugeridoVenta(value); // Actualiza solo el estado de visualización
        } else if (name === 'stock') {
            setDisplayStock(value); // Actualiza solo el estado de visualización
        } else {
            setEditFormData(prevData => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    // Manejador para formatear el número cuando el campo pierde el foco
    const handleBlurNumberField = (e) => {
        const { name } = e.target;
        let valueToParse = '';

        // Obtener el valor actual del estado de visualización correspondiente
        if (name === 'precio_costo') {
            valueToParse = displayPrecioCosto;
        } else if (name === 'precio_sugerido_venta') {
            valueToParse = displayPrecioSugeridoVenta;
        } else if (name === 'stock') {
            valueToParse = displayStock;
        }

        const cleanedValue = parseInputNumber(valueToParse); // Obtener el string limpio

        let numericValue;
        if (cleanedValue === '') {
            numericValue = ''; // Mantener como cadena vacía si el campo está vacío
        } else if (name === 'stock') {
            numericValue = parseInt(cleanedValue, 10);
        } else {
            numericValue = parseFloat(cleanedValue);
        }

        if (!isNaN(numericValue) || numericValue === '') {
            // Actualizar editFormData con el valor numérico real
            setEditFormData(prevData => ({ ...prevData, [name]: numericValue }));

            // Actualizar el estado de visualización con el valor formateado
            if (name === 'precio_costo') {
                setDisplayPrecioCosto(formatInputNumber(numericValue));
            } else if (name === 'precio_sugerido_venta') {
                setDisplayPrecioSugeridoVenta(formatInputNumber(numericValue));
            } else if (name === 'stock') {
                setDisplayStock(formatInputNumber(numericValue, true));
            }
        } else {
            // Si el valor no es un número válido después de limpiar, mostrar error y resetear
            Swal.fire('Formato Inválido', `Por favor, introduce un número válido para "${name.replace(/_/g, ' ')}".`, 'warning');
            // Resetear el campo de visualización y el valor numérico en editFormData
            if (name === 'precio_costo') {
                setDisplayPrecioCosto('');
            } else if (name === 'precio_sugerido_venta') {
                setDisplayPrecioSugeridoVenta('');
            } else if (name === 'stock') {
                setDisplayStock('');
            }
            setEditFormData(prevData => ({ ...prevData, [name]: '' }));
        }
    };

    // Función para manejar la actualización de un producto
    const handleUpdateProduct = async () => {
        setLoading(true);
        try {
            // Los valores numéricos ya están en editFormData en su formato numérico real
            const dataToSend = {
                ...editFormData,
                // Asegurarse de que los campos de clave foránea sean enteros o null
                proveedor: editFormData.proveedor ? parseInt(editFormData.proveedor) : null,
                categoria: editFormData.categoria ? parseInt(editFormData.categoria) : null,
                marca: editFormData.marca ? parseInt(editFormData.marca) : null,
            };

            // Eliminar la propiedad 'descripcion' si aún estuviera presente por algún motivo (seguridad)
            if (dataToSend.hasOwnProperty('descripcion')) {
                delete dataToSend.descripcion;
            }

            // Validación final para asegurar que los campos numéricos sean números antes de enviar
            if (isNaN(dataToSend.precio_costo) || isNaN(dataToSend.precio_sugerido_venta) || isNaN(dataToSend.stock)) {
                Swal.fire('Error de Formato', 'Por favor, asegúrate de que los campos numéricos tengan un formato correcto.', 'error');
                setLoading(false);
                return;
            }

            const response = await axios.put(
                `${API_PRODUCTOS_URL}${selectedProduct.referencia_producto}/`,
                dataToSend
            );

            if (response.status === 200) {
                Swal.fire('¡Actualizado!', 'Producto actualizado exitosamente.', 'success');
                setShowEditModal(false);
                setSelectedProduct(null);
                handleSearch({ preventDefault: () => {} });
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            let errorMessage = 'Error al actualizar el producto. Inténtalo de nuevo.';
            if (error.response && error.response.data) {
                errorMessage = Object.values(error.response.data).flat().join(' ');
            }
            Swal.fire('Error de Actualización', `Detalle: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Función para manejar la eliminación de un producto
    const handleDeleteProduct = async (referencia_producto) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡Esta acción no se puede deshacer! Si el producto tiene facturas asociadas, no podrá ser eliminado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                try {
                    const response = await axios.delete(`${API_PRODUCTOS_URL}${referencia_producto}/`);
                    if (response.status === 204) {
                        Swal.fire('¡Eliminado!', 'El producto ha sido eliminado exitosamente.', 'success');
                        setSelectedProduct(null);
                        handleSearch({ preventDefault: () => {} });
                    }
                } catch (error) {
                    console.error('Error al eliminar producto:', error.response ? error.response.data : error.message);
                    let errorMessage = 'No es posible eliminar el producto porque tiene facturas asociadas.';

                    if (error.response && error.response.status === 400) {
                        const errorData = error.response.data;
                        if (errorData.detail && (errorData.detail.includes('Cannot delete') || errorData.detail.includes('foreign key constraint'))) {
                            errorMessage = 'No es posible eliminar el producto porque tiene facturas asociadas.';
                        } else if (Object.values(errorData).flat().some(msg =>
                            String(msg).includes('facturas asociadas') || String(msg).includes('referenced by other objects') || String(msg).includes('constraint failed')
                        )) {
                             errorMessage = 'No es posible eliminar el producto porque tiene facturas asociadas.';
                        } else {
                            errorMessage = Object.values(errorData).flat().join(' ');
                        }
                    } else if (error.response && error.response.status === 409) {
                         errorMessage = 'No es posible eliminar el producto porque tiene facturas asociadas.';
                    } else if (error.message.includes('Network Error')) {
                        errorMessage = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
                    }

                    Swal.fire('Error de Eliminación', `Detalle: ${errorMessage}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <Container
            fluid
            className="edit-delete-products-page p-4"
            style={{
                minHeight: 'calc(100vh - 56px)',
                backgroundColor: '#ffffff',
                color: '#000000'
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faBoxOpen} className="me-3" /> Editar / Eliminar Productos
            </h2>
            {pageLoading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" style={{ color: '#00b45c' }}>
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2" style={{ color: '#000000' }}>Cargando datos necesarios...</p>
                </div>
            ) : (
                <>
                    {/* Sección de Búsqueda */}
                    <Card className="mb-4 shadow-sm edit-delete-card">
                        <Card.Header className="edit-delete-card-header">
                            <FontAwesomeIcon icon={faSearch} className="me-2" /> Buscar Producto
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSearch}>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="Buscar por referencia, nombre, marca o proveedor..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        aria-label="Campo de búsqueda de productos"
                                        className="form-control-light"
                                    />
                                    <Button variant="primary" type="submit" disabled={loading} className="btn-search-product">
                                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Buscar'}
                                    </Button>
                                </InputGroup>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Sección de Resultados de la Búsqueda */}
                    {loading && searchPerformed ? (
                        <div className="text-center mt-4">
                            <Spinner animation="border" role="status" style={{ color: '#00b45c' }}>
                                <span className="visually-hidden">Cargando...</span>
                            </Spinner>
                            <p className="mt-2" style={{ color: '#000000' }}>Cargando resultados de búsqueda...</p>
                        </div>
                    ) : searchPerformed && searchResults.length === 0 ? (
                        <p className="text-center mt-4 text-muted">No se encontraron productos con esa búsqueda.</p>
                    ) : (
                        <Row className="mt-4">
                            {searchResults.map((product) => (
                                <Col key={product.referencia_producto} sm={6} md={4} lg={3} className="mb-4">
                                    <Card className={selectedProduct?.referencia_producto === product.referencia_producto ? 'product-card-selected' : 'product-card'}>
                                        {product.imagen ? (
                                            <Card.Img
                                                variant="top"
                                                src={product.imagen}
                                                alt={product.nombre}
                                                className="product-card-img"
                                            />
                                        ) : (
                                            <div className="product-card-img-placeholder">
                                                No hay imagen disponible
                                            </div>
                                        )}
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title className="fw-bold text-truncate product-card-title" title={product.nombre}>{product.nombre}</Card.Title>
                                            <Card.Text className="text-muted small mb-2 product-card-text">
                                                Ref: {product.referencia_producto}
                                            </Card.Text>
                                            <Card.Text className="product-card-text">
                                                <strong>Precio Venta:</strong> ${parseFloat(product.precio_sugerido_venta).toLocaleString('es-CO')}<br />
                                                <strong>Stock:</strong> {product.stock}<br />
                                                <strong>Proveedor:</strong> {product.proveedor_nombre ? product.proveedor_nombre : 'N/A'}<br />
                                                <strong>Categoría:</strong> {product.categoria_nombre ? product.categoria_nombre : 'N/A'}<br />
                                                <strong>Marca:</strong> {product.marca_nombre ? product.marca_nombre : 'N/A'}
                                            </Card.Text>
                                            <div className="mt-auto d-flex justify-content-between">
                                                <Button
                                                    variant="info"
                                                    className="flex-fill me-2 btn-action-edit"
                                                    onClick={() => handleSelectProduct(product)}
                                                    disabled={loading}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    className="flex-fill btn-action-delete"
                                                    onClick={() => handleDeleteProduct(product.referencia_producto)}
                                                    disabled={loading}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} /> Eliminar
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </>
            )}

            {/* Modal de Edición del Producto */}
            {selectedProduct && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                    <Modal.Header closeButton className="modal-header-light">
                        <Modal.Title className="modal-title-light">Editar Producto: {selectedProduct.nombre}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-body-light">
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Referencia Producto</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="referencia_producto"
                                            value={editFormData.referencia_producto || ''}
                                            disabled
                                            className="form-control-light"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Nombre</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={editFormData.nombre || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-control-light"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Marca</Form.Label>
                                        <Form.Select
                                            name="marca"
                                            value={editFormData.marca || ''}
                                            onChange={handleEditChange}
                                            className="form-select-light"
                                        >
                                            <option value="">Selecciona una marca (Opcional)</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={String(brand.id)}>
                                                    {brand.nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Precio Costo</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                name="precio_costo"
                                                value={displayPrecioCosto}
                                                onChange={handleEditChange}
                                                onBlur={handleBlurNumberField}
                                                required
                                                placeholder="0,00"
                                                className="form-control-light text-end"
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Precio Sugerido Venta</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                name="precio_sugerido_venta"
                                                value={displayPrecioSugeridoVenta}
                                                onChange={handleEditChange}
                                                onBlur={handleBlurNumberField}
                                                required
                                                placeholder="0,00"
                                                className="form-control-light text-end"
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Stock</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="stock"
                                            value={displayStock}
                                            onChange={handleEditChange}
                                            onBlur={handleBlurNumberField}
                                            required
                                            placeholder="0"
                                            className="form-control-light text-end"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Proveedor</Form.Label>
                                        <Form.Select
                                            name="proveedor"
                                            value={editFormData.proveedor || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-select-light"
                                        >
                                            <option value="">Selecciona un proveedor</option>
                                            {providers.map(prov => (
                                                <option key={prov.id} value={String(prov.id)}>
                                                    {prov.nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Categoría</Form.Label>
                                        <Form.Select
                                            name="categoria"
                                            value={editFormData.categoria || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-select-light"
                                        >
                                            <option value="">Selecciona una categoría</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={String(cat.id)}>
                                                    {cat.nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>URL de Imagen</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="imagen"
                                            value={editFormData.imagen || ''}
                                            onChange={handleEditChange}
                                            className="form-control-light"
                                        />
                                    </Form.Group>
                                    {editFormData.imagen && (
                                        <div className="text-center mb-3 image-preview-container">
                                            <img
                                                src={editFormData.imagen}
                                                alt="Previsualización"
                                                className="image-preview"
                                            />
                                        </div>
                                    )}
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label={<span style={{color: '#000000'}}>Activo</span>}
                                            name="activo"
                                            checked={editFormData.activo || false}
                                            onChange={(e) => setEditFormData({ ...editFormData, activo: e.target.checked })}
                                            className="form-check-light"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="modal-footer-light">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading} className="btn-close-modal">
                            <FontAwesomeIcon icon={faTimes} /> Cerrar
                        </Button>
                        <Button variant="primary" onClick={handleUpdateProduct} disabled={loading} className="btn-save-product-submit">
                            {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Actualizando...</> : <><FontAwesomeIcon icon={faEdit} /> Guardar Cambios</>}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
};

export default EditarEliminarProductosPage;
