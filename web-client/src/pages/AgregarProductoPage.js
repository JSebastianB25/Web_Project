// web-client/src/pages/AgregarProductoPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Row, Col, InputGroup, Card, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faLink, faUpload, faCamera, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import Webcam from 'react-webcam';

// Importa tus estilos personalizados para esta página
import '../styles/AgregarProductos.css';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_PROVEEDORES_URL = `${API_BASE_URL}/proveedores/`;
const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias/`;
const API_MARCAS_URL = `${API_BASE_URL}/marcas/`;

// --- FUNCIONES PARA MANEJO DE NÚMEROS CON SEPARADORES ---
// Formatea un número para visualización (ej. 1234567.89 -> "1.234.567,89")
const formatInputNumber = (value, isInteger = false) => {
    if (value === null || value === undefined || value === '') return '';
    // Asegurarse de que el valor es un número antes de formatear
    const numValue = typeof value === 'string'
        ? parseFloat(value.replace(/\./g, '').replace(/,/g, '.')) // Limpiar para parsear si es string
        : parseFloat(value);

    if (isNaN(numValue)) return value; // Si no es un número, devolver el valor original

    const options = {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2, // Limitar a 2 decimales para dinero, 0 para stock
        useGrouping: true // Habilita el separador de miles
    };
    return numValue.toLocaleString('es-CO', options);
};

// Parsea un string formateado a un string numérico limpio para cálculos/envío (ej. "1.234.567,89" -> "1234567.89")
const parseInputNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    // Elimina separadores de miles (puntos) y reemplaza la coma decimal por punto decimal.
    // Esto es crucial para que parseFloat() funcione correctamente en JavaScript.
    return String(value).replace(/\./g, '').replace(/,/g, '.');
};
// --- FIN FUNCIONES DE NÚMEROS ---


const AgregarProductoPage = () => {
    const navigate = useNavigate();

    // Estado para los datos del nuevo producto. Los campos numéricos se mantienen como string.
    const [formData, setFormData] = useState({
        nombre: '',
        marca: '',
        precio_costo: '',
        precio_sugerido_venta: '',
        stock: '',
        proveedor: '',
        categoria: '',
        activo: true,
    });

    // Estados para cargar las listas de proveedores, categorías y marcas
    const [providers, setProviders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false); // Estado para el spinner de envío
    const [pageLoading, setPageLoading] = useState(true); // Estado para el spinner de carga inicial
    const [error, setError] = useState(null); // Estado para mensajes de error generales

    // Estados para la referencia generada y el código de barras
    const [generatedReference, setGeneratedReference] = useState('');
    const [showBarcode, setShowBarcode] = useState(false);

    // ESTADOS PARA MANEJO DE IMAGEN
    const [imageFile, setImageFile] = useState(null); // Almacena el objeto File (de carga o captura)
    const [imageUrl, setImageUrl] = useState(''); // Almacena la URL de la imagen (si se usa)
    const [previewUrl, setPreviewUrl] = useState(''); // URL para la previsualización en el <img>
    const [showCameraModal, setShowCameraModal] = useState(false); // Controla la visibilidad del modal de la cámara
    const webcamRef = useRef(null); // Referencia para el componente Webcam

    // useEffect para cargar proveedores, categorías y marcas cuando el componente se monta
    useEffect(() => {
        const fetchRelatedData = async () => {
            setPageLoading(true);
            setError(null);
            try {
                const [categoriesRes, providersRes, brandsRes] = await Promise.all([
                    axios.get(API_CATEGORIAS_URL),
                    axios.get(API_PROVEEDORES_URL),
                    axios.get(API_MARCAS_URL),
                ]);
                setCategories(categoriesRes.data);
                setProviders(providersRes.data);
                setBrands(brandsRes.data);
            } catch (err) {
                console.error('Error al cargar listas relacionadas:', err);
                setError('No se pudieron cargar los proveedores, categorías o marcas. Intenta de nuevo.');
                Swal.fire('Error de Carga', 'No se pudieron cargar las listas de categorías, proveedores o marcas.', 'error');
            } finally {
                setPageLoading(false);
            }
        };
        fetchRelatedData();
    }, []);

    // useEffect para generar y mostrar el código de barras cuando `generatedReference` cambie
    useEffect(() => {
        if (showBarcode && generatedReference) {
            try {
                const barcodeElement = document.getElementById('barcode');
                if (barcodeElement) {
                    JsBarcode(barcodeElement, generatedReference, {
                        format: "CODE128", // Formato de código de barras alfanumérico
                        lineColor: "#000",
                        width: 2,
                        height: 50,
                        displayValue: true // Muestra el valor de la referencia debajo del código
                    });
                }
            } catch (err) {
                console.error('Error al generar código de barras:', err);
                // Manejar error si la referencia es demasiado larga o inválida para el formato
            }
        }
    }, [generatedReference, showBarcode]);

    // Manejador de cambios para todos los campos del formulario (excepto imagen)
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = value;

        if (type === 'checkbox') {
            newValue = checked;
        } else if (name === 'precio_costo' || name === 'precio_sugerido_venta') {
            newValue = value;
        } else if (name === 'stock') {
            newValue = value.replace(/[^0-9]/g, '');
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: newValue,
        }));
    };

    // Manejador para el cambio del input de archivo (Subir desde Archivo)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file); // Guarda el objeto File
            setImageUrl(''); // Limpia la URL si se selecciona un archivo
            setPreviewUrl(URL.createObjectURL(file)); // Crea una URL temporal para la previsualización
        } else {
            setImageFile(null);
            setPreviewUrl('');
        }
    };

    // Manejador para el cambio del input de URL (URL de Imagen)
    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url); // Guarda la URL
        setImageFile(null); // Limpia el archivo si se introduce una URL
        setPreviewUrl(url); // Usa la URL directamente para la previsualización
    };

    // Función para tomar foto con la webcam
    const handleCapturePhoto = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot(); // Obtiene la imagen como Data URL
            if (imageSrc) {
                // Convierte la Data URL a un Blob y luego a un objeto File
                fetch(imageSrc)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], `webcam_capture_${Date.now()}.jpeg`, { type: "image/jpeg" });
                        setImageFile(file); // Guarda el archivo capturado
                        setImageUrl(''); // Limpia la URL
                        setPreviewUrl(URL.createObjectURL(file)); // Previsualiza el archivo capturado
                        setShowCameraModal(false); // Cierra el modal de la cámara
                    })
                    .catch(err => {
                        console.error("Error al convertir la captura a archivo:", err);
                        Swal.fire('Error', 'No se pudo procesar la imagen de la cámara.', 'error');
                    });
            }
        }
    };

    // Función para eliminar la imagen seleccionada/capturada (limpia todos los estados de imagen)
    const handleRemoveImage = () => {
        setImageFile(null);
        setImageUrl('');
        setPreviewUrl('');
        setShowCameraModal(false); // Asegurarse de que el modal de la webcam esté cerrado
    };


    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGeneratedReference(''); // Limpia la referencia generada previamente
        setShowBarcode(false); // Oculta el código de barras anterior

        try {
            // Crea un objeto FormData para enviar archivos y otros datos
            const formDataToSend = new FormData();

            // Añadir campos de texto/número al FormData
            formDataToSend.append('nombre', formData.nombre);
            formDataToSend.append('precio_costo', parseFloat(parseInputNumber(formData.precio_costo)));
            formDataToSend.append('precio_sugerido_venta', parseFloat(parseInputNumber(formData.precio_sugerido_venta)));
            formDataToSend.append('stock', parseInt(parseInputNumber(formData.stock)));
            formDataToSend.append('activo', formData.activo);

            // Añadir IDs relacionados. Asegúrate de manejar los casos null/vacío
            if (formData.proveedor) formDataToSend.append('proveedor', parseInt(formData.proveedor));
            if (formData.categoria) formDataToSend.append('categoria', parseInt(formData.categoria));
            if (formData.marca) formDataToSend.append('marca', parseInt(formData.marca));

            // Manejo de la imagen: prioriza el archivo (subido o capturado) sobre la URL
            if (imageFile) {
                formDataToSend.append('imagen', imageFile); // Añadir el archivo de imagen
            } else if (imageUrl) {
                formDataToSend.append('imagen', imageUrl); // Añadir la URL de la imagen
            }
            // Si no hay 'imageFile' ni 'imageUrl', no se envía el campo 'imagen' en el FormData,
            // lo cual es adecuado para ImageField en Django con blank=True, null=True.

            const response = await axios.post(API_PRODUCTOS_URL, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // MUY IMPORTANTE para enviar FormData con archivos
                },
            });

            if (response.status === 201) {
                const newProduct = response.data;
                Swal.fire(
                    '¡Producto Agregado!',
                    'El producto se ha agregado exitosamente.',
                    'success'
                );
                // Si el backend devuelve la referencia generada, la guardamos para mostrarla
                if (newProduct.referencia_producto) {
                    setGeneratedReference(newProduct.referencia_producto);
                    setShowBarcode(true); // Muestra el código de barras
                }

                // Limpia el formulario y estados de imagen
                setFormData({
                    nombre: '', marca: '',
                    precio_costo: '', precio_sugerido_venta: '', stock: '',
                    proveedor: '', categoria: '', activo: true,
                });
                setImageFile(null);
                setImageUrl('');
                setPreviewUrl('');
                setShowCameraModal(false); // Cierra el modal de la cámara
            } else {
                Swal.fire('Error', 'Hubo un problema al agregar el producto.', 'error');
            }

        } catch (err) {
            console.error('Error al agregar producto:', err.response ? err.response.data : err);
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error inesperado al agregar el producto.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Manejador para formatear el número cuando el campo pierde el foco
    const handleBlurNumberField = (e) => {
        const { name, value } = e.target;
        const cleanedValue = parseInputNumber(value); // Obtiene el valor numérico limpio como string (ej. "560000.00")

        let numericValue;
        if (name === 'stock') {
            numericValue = parseInt(cleanedValue);
        } else {
            numericValue = parseFloat(cleanedValue);
        }

        // Si el valor numérico es válido, actualiza el estado con ese número.
        // Si no es un número válido O el valor limpio está vacío, establece el estado a string vacío.
        if (!isNaN(numericValue) && cleanedValue !== '') {
            setFormData(prevData => ({ ...prevData, [name]: numericValue }));
        } else {
            setFormData(prevData => ({ ...prevData, [name]: '' }));
            if (cleanedValue !== '') { // Solo mostrar advertencia si intentaron escribir algo inválido
                 Swal.fire('Formato Inválido', `Por favor, introduce un número válido para "${name.replace(/_/g, ' ')}".`, 'warning');
            }
        }
    };

    return (
        <Container
            fluid
            className="add-product-page p-4"
            style={{
                minHeight: 'calc(100vh - 56px)',
                backgroundColor: '#ffffff',
                color: '#000000'
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faPlus} className="me-3" /> Agregar Nuevo Producto
            </h2>

            {pageLoading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" style={{ color: '#00b45c' }}>
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2" style={{ color: '#000000' }}>Cargando datos necesarios...</p>
                </div>
            ) : (
                <Card className="add-product-card">
                    <Card.Body>
                        <Card.Title className="add-product-card-title"></Card.Title>
                        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                {/* Columna Izquierda: Campos de texto y números */}
                                <Col md={6}>
                                    {/* Campo de Referencia Producto - Ahora solo texto */}
                                    <Form.Group className="mb-3" controlId="formReferenciaProducto">
                                        <Form.Label style={{color: '#000000'}}>Referencia Producto</Form.Label>
                                        <p className="form-control-static" style={{color: '#000000', fontWeight: 'bold'}}>
                                            {generatedReference || "Se generará automáticamente al guardar"}
                                        </p>
                                        <Form.Text className="text-muted">
                                            Este campo no necesita ser llenado.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formNombre">
                                        <Form.Label style={{color: '#000000'}}>Nombre</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej: Camiseta Algodón"
                                            className="form-control-light"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formPrecioCosto">
                                        <Form.Label style={{color: '#000000'}}>Precio Costo</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                name="precio_costo"
                                                value={typeof formData.precio_costo === 'number'
                                                    ? formatInputNumber(formData.precio_costo)
                                                    : formData.precio_costo
                                                }
                                                onChange={handleChange}
                                                onBlur={handleBlurNumberField}
                                                required
                                                placeholder="0,00"
                                                className="form-control-light text-end"
                                                inputMode="decimal"
                                            />
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formPrecioSugeridoVenta">
                                        <Form.Label style={{color: '#000000'}}>Precio Sugerido Venta</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                name="precio_sugerido_venta"
                                                value={typeof formData.precio_sugerido_venta === 'number'
                                                    ? formatInputNumber(formData.precio_sugerido_venta)
                                                    : formData.precio_sugerido_venta
                                                }
                                                onChange={handleChange}
                                                onBlur={handleBlurNumberField}
                                                required
                                                placeholder="0,00"
                                                className="form-control-light text-end"
                                                inputMode="decimal"
                                            />
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formStock">
                                        <Form.Label style={{color: '#000000'}}>Stock</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="stock"
                                            value={typeof formData.stock === 'number'
                                                ? formatInputNumber(formData.stock, true)
                                                : formData.stock
                                            }
                                            onChange={handleChange}
                                            onBlur={handleBlurNumberField}
                                            required
                                            placeholder="0"
                                            className="form-control-light text-end"
                                            inputMode="numeric"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formActivo">
                                        <Form.Check
                                            type="checkbox"
                                            label={<span style={{color: '#000000'}}>Activo</span>}
                                            name="activo"
                                            checked={formData.activo}
                                            onChange={handleChange}
                                            className="form-check-light"
                                        />
                                    </Form.Group>

                                    {/* Botón de Agregar Producto - REPOSICIONADO AQUÍ */}
                                    <Button type="submit" disabled={loading} className="btn-add-product-submit w-100 mt-3">
                                        {loading ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} spin /> Agregando...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPlus} /> Agregar Producto
                                            </>
                                        )}
                                    </Button>
                                </Col>

                                {/* Columna Derecha: Selectores e Imagen */}
                                <Col md={6}>
                                    {/* Proveedor, Categoría y Marca compactados en una fila */}
                                    <Row className="mb-3">
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="formProveedor">
                                                <Form.Label style={{color: '#000000'}}>Proveedor</Form.Label>
                                                <Form.Select
                                                    name="proveedor"
                                                    value={formData.proveedor}
                                                    onChange={handleChange}
                                                    required
                                                    className="form-select-light"
                                                >
                                                    <option value="">Selecciona</option>
                                                    {providers.map(prov => (
                                                        <option key={prov.id} value={String(prov.id)}>
                                                            {prov.nombre}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="formCategoria">
                                                <Form.Label style={{color: '#000000'}}>Categoría</Form.Label>
                                                <Form.Select
                                                    name="categoria"
                                                    value={formData.categoria}
                                                    onChange={handleChange}
                                                    required
                                                    className="form-select-light"
                                                >
                                                    <option value="">Selecciona</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={String(cat.id)}>
                                                            {cat.nombre}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} className="mt-3">
                                            <Form.Group controlId="formMarca">
                                                <Form.Label style={{color: '#000000'}}>Marca</Form.Label>
                                                <Form.Select
                                                    name="marca"
                                                    value={formData.marca}
                                                    onChange={handleChange}
                                                    className="form-select-light"
                                                >
                                                    <option value="">Selecciona una marca</option>
                                                    {brands.map(brand => (
                                                        <option key={brand.id} value={String(brand.id)}>
                                                            {brand.nombre}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* SECCIÓN DE MANEJO DE IMAGEN - DISEÑO MEJORADO */}
                                    <Card className="mb-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                                        <Card.Header as="h5" style={{ backgroundColor: '#007bff', color: 'white', borderBottom: '1px solid #0056b3' }}>
                                            Imagen del Producto
                                        </Card.Header>
                                        <Card.Body>
                                            {/* Área de Previsualización de Imagen */}
                                            <div className="image-preview-area mb-3 d-flex flex-column justify-content-center align-items-center">
                                                {previewUrl ? (
                                                    <div style={{ position: 'relative' }}>
                                                        <img
                                                            src={previewUrl}
                                                            alt="Previsualización"
                                                            className="img-fluid rounded"
                                                            style={{ maxWidth: '350px', maxHeight: '350px', objectFit: 'contain', border: '1px solid #ddd' }}
                                                        />
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={handleRemoveImage}
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
                                                        value={imageUrl}
                                                        onChange={handleImageUrlChange}
                                                        placeholder="Pega la URL de una imagen aquí..."
                                                        disabled={!!imageFile}
                                                    />
                                                </Form.Group>

                                                {/* Opción 2: Subir desde Archivo */}
                                                <Form.Group>
                                                    <Form.Label style={{ color: '#000000' }}><FontAwesomeIcon icon={faUpload} className="me-2" /> Subir desde Archivo (Opcional)</Form.Label>
                                                    <Form.Control
                                                        type="file"
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                        disabled={!!imageUrl}
                                                    />
                                                </Form.Group>

                                                {/* Opción 3: Tomar Foto */}
                                                <Button
                                                    variant="info"
                                                    onClick={() => setShowCameraModal(true)}
                                                    disabled={!!imageFile || !!imageUrl}
                                                    className="w-100 mt-2"
                                                >
                                                    <FontAwesomeIcon icon={faCamera} className="me-2" /> Tomar Foto
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Contenedor para mostrar la referencia generada y el código de barras */}
                            {showBarcode && generatedReference && (
                                <div className="mt-4 text-center">
                                    <h4 style={{ color: '#000000' }}>Referencia del Producto Generada:</h4>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000000' }}>{generatedReference}</p>
                                    <div className="barcode-container">
                                        <svg id="barcode"></svg>
                                    </div>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedReference)
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
                    </Card.Body>
                </Card>
            )}

            {/* Modal para la cámara */}
            <Modal show={showCameraModal} onHide={() => setShowCameraModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Tomar Foto</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {showCameraModal && (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width="100%"
                            videoConstraints={{ facingMode: "environment" }}
                            className="mb-3 rounded"
                        />
                    )}
                    <Button variant="success" onClick={handleCapturePhoto} className="mt-3 w-75">
                        <FontAwesomeIcon icon={faCamera} className="me-2" /> Capturar Foto
                    </Button>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AgregarProductoPage;
