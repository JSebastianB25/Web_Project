// web-client/src/pages/EditarEliminarProductosPage.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { faSearch, faEdit, faTrash, faTimes, faBoxOpen, faSpinner, faLink, faUpload, faCamera, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import JsBarcode from 'jsbarcode';
import Webcam from 'react-webcam';

// Importa tus estilos personalizados para esta página
import '../styles/EditarProductosPage.css';

// URL base de tu API de productos
const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias/`;
const API_PROVEEDORES_URL = `${API_BASE_URL}/proveedores/`;
const API_MARCAS_URL = `${API_BASE_URL}/marcas/`;

// --- FUNCIONES PARA MANEJO DE NÚMEROS CON SEPARADORES ---
// Formatea un número para mostrarlo en un input de texto (con separadores de miles y coma decimal)
const formatInputNumber = (value, isInteger = false) => {
    if (value === null || value === undefined || value === '') return '';

    let numValue;
    if (typeof value === 'string') {
        if (value.includes(',')) {
            numValue = parseFloat(value.replace(/\./g, '').replace(/,/g, '.'));
        } else {
            numValue = parseFloat(value);
        }
    } else {
        numValue = parseFloat(value);
    }

    if (isNaN(numValue)) return '';

    const options = {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2,
        useGrouping: true
    };

    if (!isInteger && numValue % 1 === 0) {
        options.minimumFractionDigits = 2;
    }

    const formattedValue = numValue.toLocaleString('es-CO', options);
    return formattedValue;
};

// Parsea un string formateado de input a un número (eliminando separadores de miles y cambiando coma a punto)
const parseInputNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const cleanedValue = String(value).replace(/\./g, '').replace(/,/g, '.');
    return cleanedValue;
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
        activo: true, // 'imagen' ya no está aquí, se maneja por separado
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

    // ESTADOS PARA MANEJO DE IMAGEN EN EDICIÓN
    const [editImageFile, setEditImageFile] = useState(null);
    const [editImageUrl, setEditImageUrl] = useState('');
    const [editPreviewUrl, setEditPreviewUrl] = useState('');
    const [showEditCameraModal, setShowEditCameraModal] = useState(false);
    const webcamEditRef = useRef(null);

    // Estados para la referencia generada y el código de barras en edición
    const [editGeneratedReference, setEditGeneratedReference] = useState('');
    const [showEditBarcode, setShowEditBarcode] = useState(false);


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

    // useEffect para generar y mostrar el código de barras en el modal de edición
    useEffect(() => {
        if (showEditBarcode && editGeneratedReference) {
            try {
                const barcodeElement = document.getElementById('edit-barcode'); // ID diferente para el modal
                if (barcodeElement) {
                    JsBarcode(barcodeElement, editGeneratedReference, {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 2,
                        height: 50,
                        displayValue: true
                    });
                }
            } catch (err) {
                console.error('Error al generar código de barras en edición:', err);
            }
        }
    }, [editGeneratedReference, showEditBarcode]);


    // Función para seleccionar un producto y abrir el modal de edición
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);

        // Inicializa editFormData con los valores del producto
        setEditFormData({
            referencia_producto: product.referencia_producto || '',
            nombre: product.nombre || '',
            marca: product.marca && typeof product.marca === 'object' && product.marca.id ? String(product.marca.id) : (product.marca ? String(product.marca) : ''),
            precio_costo: parseFloat(product.precio_costo),
            precio_sugerido_venta: parseFloat(product.precio_sugerido_venta),
            stock: parseInt(product.stock),
            proveedor: product.proveedor && typeof product.proveedor === 'object' && product.proveedor.id ? String(product.proveedor.id) : (product.proveedor ? String(product.proveedor) : ''),
            categoria: product.categoria && typeof product.categoria === 'object' && product.categoria.id ? String(product.categoria.id) : (product.categoria ? String(product.categoria) : ''),
            activo: product.activo,
        });

        // Inicializa los estados de visualización con los valores formateados
        setDisplayPrecioCosto(formatInputNumber(product.precio_costo));
        setDisplayPrecioSugeridoVenta(formatInputNumber(product.precio_sugerido_venta));
        setDisplayStock(formatInputNumber(product.stock, true));

        // Inicializa los estados de imagen para edición
        if (product.imagen) {
            // Si la imagen es una ruta relativa, construir la URL completa
            // Asumimos que MEDIA_URL es '/media/' y tu API_BASE_URL es 'http://localhost:8000/api'
            // Entonces la base para media es 'http://localhost:8000'
            const fullImageUrl = product.imagen.startsWith('http') ? product.imagen : `${API_BASE_URL.replace('/api', '')}${product.imagen}`;
            setEditImageUrl(fullImageUrl);
            setEditPreviewUrl(fullImageUrl);
            setEditImageFile(null); // Asegurarse de que no haya un archivo pendiente de una sesión anterior
        } else {
            setEditImageUrl('');
            setEditPreviewUrl('');
            setEditImageFile(null);
        }

        // Inicializa la referencia y muestra el código de barras en el modal
        setEditGeneratedReference(product.referencia_producto || '');
        setShowEditBarcode(!!product.referencia_producto); // Muestra solo si hay referencia

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
            setDisplayPrecioCosto(value);
        } else if (name === 'precio_sugerido_venta') {
            setDisplayPrecioSugeridoVenta(value);
        } else if (name === 'stock') {
            setDisplayStock(value);
        } else {
            setEditFormData(prevData => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    // Manejador para formatear el número cuando el campo pierde el foco (en edición)
    const handleBlurNumberField = (e) => {
        const { name } = e.target;
        let valueToParse = '';

        if (name === 'precio_costo') {
            valueToParse = displayPrecioCosto;
        } else if (name === 'precio_sugerido_venta') {
            valueToParse = displayPrecioSugeridoVenta;
        } else if (name === 'stock') {
            valueToParse = displayStock;
        }

        const cleanedValue = parseInputNumber(valueToParse);

        let numericValue;
        if (cleanedValue === '') {
            numericValue = '';
        } else if (name === 'stock') {
            numericValue = parseInt(cleanedValue, 10);
        } else {
            numericValue = parseFloat(cleanedValue);
        }

        if (!isNaN(numericValue) || numericValue === '') {
            setEditFormData(prevData => ({ ...prevData, [name]: numericValue }));

            if (name === 'precio_costo') {
                setDisplayPrecioCosto(formatInputNumber(numericValue));
            } else if (name === 'precio_sugerido_venta') {
                setDisplayPrecioSugeridoVenta(formatInputNumber(numericValue));
            } else if (name === 'stock') {
                setDisplayStock(formatInputNumber(numericValue, true));
            }
        } else {
            Swal.fire('Formato Inválido', `Por favor, introduce un número válido para "${name.replace(/_/g, ' ')}".`, 'warning');
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

    // Manejador para el cambio del input de archivo (en edición)
    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditImageFile(file);
            setEditImageUrl('');
            setEditPreviewUrl(URL.createObjectURL(file));
        } else {
            setEditImageFile(null);
            setEditPreviewUrl('');
        }
    };

    // Manejador para el cambio del input de URL (en edición)
    const handleEditImageUrlChange = (e) => {
        const url = e.target.value;
        setEditImageUrl(url);
        setEditImageFile(null);
        setEditPreviewUrl(url);
    };

    // Función para tomar foto con la webcam (en edición)
    const handleEditCapturePhoto = () => {
        if (webcamEditRef.current) {
            const imageSrc = webcamEditRef.current.getScreenshot();
            if (imageSrc) {
                fetch(imageSrc)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], `webcam_edit_capture_${Date.now()}.jpeg`, { type: "image/jpeg" });
                        setEditImageFile(file);
                        setEditImageUrl('');
                        setEditPreviewUrl(URL.createObjectURL(file));
                        setShowEditCameraModal(false);
                    })
                    .catch(err => {
                        console.error("Error al convertir la captura a archivo en edición:", err);
                        Swal.fire('Error', 'No se pudo procesar la imagen de la cámara para edición.', 'error');
                    });
            }
        }
    };

    // Función para eliminar la imagen seleccionada/capturada en edición
    const handleRemoveEditImage = () => {
        setEditImageFile(null);
        setEditImageUrl('');
        setEditPreviewUrl('');
        setShowEditCameraModal(false);
    };


    // Función para manejar la actualización de un producto
    const handleUpdateProduct = async () => {
        setLoading(true);
        try {
            const dataToSend = new FormData();

            dataToSend.append('nombre', editFormData.nombre);
            dataToSend.append('precio_costo', parseFloat(parseInputNumber(displayPrecioCosto))); // Usar display state para el valor actual
            dataToSend.append('precio_sugerido_venta', parseFloat(parseInputNumber(displayPrecioSugeridoVenta))); // Usar display state
            dataToSend.append('stock', parseInt(parseInputNumber(displayStock))); // Usar display state
            dataToSend.append('activo', editFormData.activo);

            if (editFormData.proveedor) dataToSend.append('proveedor', parseInt(editFormData.proveedor));
            if (editFormData.categoria) dataToSend.append('categoria', parseInt(editFormData.categoria));
            if (editFormData.marca) dataToSend.append('marca', parseInt(editFormData.marca));

            if (editImageFile) {
                dataToSend.append('imagen', editImageFile); // Añadir el archivo de imagen
            } else if (editImageUrl) {
                dataToSend.append('imagen', editImageUrl); // Añadir la URL de la imagen
            } else {
                // Si no hay archivo ni URL, y antes había una imagen, enviamos una cadena vacía
                // para indicar al backend que se debe eliminar la imagen existente.
                // Esto depende de cómo tu serializador de Django maneje el campo ImageField vacío.
                // Si tu ImageField tiene blank=True y null=True, una cadena vacía suele funcionar.
                 dataToSend.append('imagen', '');
            }

            // Eliminar la propiedad 'descripcion' si aún estuviera presente por algún motivo (seguridad)
            if (dataToSend.hasOwnProperty('descripcion')) {
                dataToSend.delete('descripcion'); // Usar .delete para FormData
            }

            // Validación final para asegurar que los campos numéricos sean números antes de enviar
            if (isNaN(parseFloat(parseInputNumber(displayPrecioCosto))) ||
                isNaN(parseFloat(parseInputNumber(displayPrecioSugeridoVenta))) ||
                isNaN(parseInt(parseInputNumber(displayStock)))) {
                Swal.fire('Error de Formato', 'Por favor, asegúrate de que los campos numéricos tengan un formato correcto.', 'error');
                setLoading(false);
                return;
            }

            const response = await axios.put(
                `${API_PRODUCTOS_URL}${selectedProduct.referencia_producto}/`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data', // MUY IMPORTANTE para FormData
                    },
                }
            );

            if (response.status === 200) {
                Swal.fire('¡Actualizado!', 'Producto actualizado exitosamente.', 'success');
                setShowEditModal(false);
                setSelectedProduct(null);
                handleSearch({ preventDefault: () => {} }); // Refrescar la lista de productos
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error.response ? error.response.data : error);
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
                            {searchResults.map((product) => {
                                // Lógica para construir la URL completa de la imagen para las tarjetas de búsqueda
                                let displayImageUrl = '';
                                if (product.imagen) {
                                    displayImageUrl = product.imagen.startsWith('http')
                                        ? product.imagen
                                        : `${API_BASE_URL.replace('/api', '')}${product.imagen}`;
                                }

                                return (
                                    <Col key={product.referencia_producto} sm={6} md={4} lg={3} className="mb-4">
                                        <Card className={selectedProduct?.referencia_producto === product.referencia_producto ? 'product-card-selected' : 'product-card'}>
                                            {displayImageUrl ? ( // Usar la URL construida aquí
                                                <Card.Img
                                                    variant="top"
                                                    src={displayImageUrl}
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
                                );
                            })}
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
                                {/* Columna Izquierda: Campos de texto y números */}
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Referencia Producto</Form.Label>
                                        <p className="form-control-static" style={{color: '#000000', fontWeight: 'bold'}}>
                                            {editGeneratedReference || "No disponible"}
                                        </p>
                                        <Form.Text className="text-muted">
                                            Este campo no es editable.
                                        </Form.Text>
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

                                    {/* Marca y Categoría movidos a la izquierda */}
                                    <Row className="mb-3">
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="formMarcaEdit">
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
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="formCategoriaEdit">
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
                                        </Col>
                                    </Row>

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
                                        <Form.Check
                                            type="checkbox"
                                            label={<span style={{color: '#000000'}}>Activo</span>}
                                            name="activo"
                                            checked={editFormData.activo || false}
                                            onChange={handleEditChange} // Usa handleEditChange para checkbox
                                            className="form-check-light"
                                        />
                                    </Form.Group>
                                </Col>
                                {/* Columna Derecha: Proveedor y la sección de Imagen */}
                                <Col md={6}>
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

                                    {/* SECCIÓN DE MANEJO DE IMAGEN - DISEÑO MEJORADO EN MODAL */}
                                    <Card className="mb-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                                        <Card.Header as="h5" style={{ backgroundColor: '#007bff', color: 'white', borderBottom: '1px solid #0056b3' }}>
                                            Imagen del Producto
                                        </Card.Header>
                                        <Card.Body>
                                            {/* Área de Previsualización de Imagen */}
                                            <div className="image-preview-area mb-3 d-flex flex-column justify-content-center align-items-center">
                                                {editPreviewUrl ? (
                                                    <div style={{ position: 'relative' }}>
                                                        <img
                                                            src={editPreviewUrl}
                                                            alt="Previsualización"
                                                            className="img-fluid rounded"
                                                            style={{ maxWidth: '350px', maxHeight: '350px', objectFit: 'contain', border: '1px solid #ddd' }}
                                                        />
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={handleRemoveEditImage}
                                                            style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 10, borderRadius: '50%', width: '30px', height: '30px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                        >
                                                            <FontAwesomeIcon icon={faTimesCircle} />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted">
                                                        <FontAwesomeIcon icon={faPlus} size="3x" className="mb-2" />
                                                        <p>No hay imagen seleccionada</p>
                                                    </div>
                                                )}
                                            </div>

                                            <hr className="my-3" /> {/* Separador visual */}

                                            {/* Opciones de Carga/Captura */}
                                            <div className="d-flex flex-column gap-3">
                                                {/* Opción 1: Cargar desde URL */}
                                                <Form.Group>
                                                    <Form.Label style={{ color: '#000000' }}><FontAwesomeIcon icon={faLink} className="me-2" /> Cargar desde URL (Opcional)</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={editImageUrl}
                                                        onChange={handleEditImageUrlChange}
                                                        placeholder="Pega la URL de una imagen aquí..."
                                                        disabled={!!editImageFile}
                                                    />
                                                </Form.Group>

                                                {/* Opción 2: Subir desde Archivo */}
                                                <Form.Group>
                                                    <Form.Label style={{ color: '#000000' }}><FontAwesomeIcon icon={faUpload} className="me-2" /> Subir desde Archivo (Opcional)</Form.Label>
                                                    <Form.Control
                                                        type="file"
                                                        onChange={handleEditFileChange}
                                                        accept="image/*"
                                                        disabled={!!editImageUrl}
                                                    />
                                                </Form.Group>

                                                {/* Opción 3: Tomar Foto */}
                                                <Button
                                                    variant="info"
                                                    onClick={() => setShowEditCameraModal(true)}
                                                    disabled={!!editImageFile || !!editImageUrl}
                                                    className="w-100 mt-2"
                                                >
                                                    <FontAwesomeIcon icon={faCamera} className="me-2" /> Tomar Foto
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            {/* Contenedor para mostrar la referencia generada y el código de barras en el modal */}
                            {showEditBarcode && editGeneratedReference && (
                                <div className="mt-4 text-center">
                                    <h4 style={{ color: '#000000' }}>Referencia del Producto:</h4>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000000' }}>{editGeneratedReference}</p>
                                    <div className="barcode-container">
                                        <svg id="edit-barcode"></svg> {/* ID diferente para el modal */}
                                    </div>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(editGeneratedReference)
                                                .then(() => Swal.fire('Copiado', 'Referencia copiada al portapapeles.', 'info'))
                                                .catch(err => console.error('Error al copiar al portapapeles:', err));
                                        }}
                                        className="mt-2"
                                    >
                                        Copiar Referencia
                                    </Button>
                                </div>
                            )}
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

            {/* Modal para la cámara en edición */}
            <Modal show={showEditCameraModal} onHide={() => setShowEditCameraModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Tomar Foto para Edición</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {showEditCameraModal && (
                        <Webcam
                            audio={false}
                            ref={webcamEditRef}
                            screenshotFormat="image/jpeg"
                            width="100%"
                            videoConstraints={{ facingMode: "environment" }}
                            className="mb-3 rounded"
                        />
                    )}
                    <Button variant="success" onClick={handleEditCapturePhoto} className="mt-3 w-75">
                        <FontAwesomeIcon icon={faCamera} className="me-2" /> Capturar Foto
                    </Button>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default EditarEliminarProductosPage;
