// web-client/src/pages/AgregarProductoPage.js

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, InputGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// Importa tus estilos personalizados para esta página
import '../styles/AgregarProductos.css';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_PROVEEDORES_URL = `${API_BASE_URL}/proveedores/`;
const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias/`;

// --- NUEVAS FUNCIONES PARA MANEJO DE NÚMEROS CON SEPARADORES ---
// Formatea un número para mostrarlo en un input de texto (con separadores de miles y coma decimal)
const formatInputNumber = (value, isInteger = false) => {
    if (value === null || value === undefined || value === '') return '';
    // Si el valor ya es un número, o si es un string que se puede parsear directamente
    const numValue = typeof value === 'string'
        ? parseFloat(value.replace(/\./g, '').replace(/,/g, '.')) // Limpiar string antes de parsear
        : parseFloat(value);

    // Si no es un número válido, devuelve el valor original (permite que el usuario siga escribiendo)
    if (isNaN(numValue)) return value;

    const options = {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2,
        useGrouping: true // Habilitar separadores de miles
    };
    return numValue.toLocaleString('es-CO', options);
};

// Parsea un string formateado de input a un número (eliminando separadores de miles y cambiando coma a punto)
const parseInputNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    // Eliminar separadores de miles (puntos) y reemplazar coma decimal con punto
    const cleanedValue = String(value).replace(/\./g, '').replace(/,/g, '.');
    return cleanedValue; // Devuelve el string limpio, se convertirá a número en onBlur o handleSubmit
};
// --- FIN FUNCIONES DE NÚMEROS ---


const AgregarProductoPage = () => {
    const navigate = useNavigate();

    // Estado para los datos del nuevo producto
    const [formData, setFormData] = useState({
        referencia_producto: '',
        nombre: '',
        descripcion: '',
        precio_costo: '', // Mantenemos como string inicialmente para el input
        precio_sugerido_venta: '', // Mantenemos como string
        stock: '', // Mantenemos como string
        proveedor: '',
        categoria: '',
        imagen: '',
        activo: true,
    });

    // Estados para cargar las listas de proveedores y categorías
    const [providers, setProviders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect para cargar proveedores y categorías cuando el componente se monta
    useEffect(() => {
        const fetchRelatedData = async () => {
            setPageLoading(true);
            setError(null);
            try {
                const [categoriesRes, providersRes] = await Promise.all([
                    axios.get(API_CATEGORIAS_URL),
                    axios.get(API_PROVEEDORES_URL),
                ]);
                setCategories(categoriesRes.data);
                setProviders(providersRes.data);
            } catch (err) {
                console.error('Error al cargar listas relacionadas:', err);
                setError('No se pudieron cargar los proveedores o categorías. Intenta de nuevo.');
                Swal.fire('Error de Carga', 'No se pudieron cargar las listas de categorías o proveedores.', 'error');
            } finally {
                setPageLoading(false);
            }
        };
        fetchRelatedData();
    }, []);

    // Manejador de cambios para todos los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = value;

        if (type === 'checkbox') {
            newValue = checked;
        } else if (name === 'precio_costo' || name === 'precio_sugerido_venta' || name === 'stock') {
            // Para campos numéricos, almacenamos el string limpio (sin formatear) en el estado
            newValue = parseInputNumber(value);
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: newValue,
        }));
    };

    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Aquí, convertimos los strings limpios a números reales para el envío
            const dataToSend = {
                ...formData,
                proveedor: formData.proveedor ? parseInt(formData.proveedor) : null,
                categoria: formData.categoria ? parseInt(formData.categoria) : null,
                // Aseguramos que los precios y stock sean números para la API
                precio_costo: parseFloat(parseInputNumber(formData.precio_costo)),
                precio_sugerido_venta: parseFloat(parseInputNumber(formData.precio_sugerido_venta)),
                stock: parseInt(parseInputNumber(formData.stock)),
            };

            // Validación básica para asegurar que los campos numéricos sean números
            if (isNaN(dataToSend.precio_costo) || isNaN(dataToSend.precio_sugerido_venta) || isNaN(dataToSend.stock)) {
                Swal.fire('Error de Formato', 'Por favor, asegúrate de que los campos numéricos tengan un formato correcto.', 'error');
                setLoading(false);
                return;
            }


            const response = await axios.post(API_PRODUCTOS_URL, dataToSend);

            if (response.status === 201) {
                Swal.fire(
                    '¡Producto Agregado!',
                    'El producto se ha agregado exitosamente.',
                    'success'
                );
                // Limpia el formulario y resetea los campos numéricos a string vacío
                setFormData({
                    referencia_producto: '', nombre: '', descripcion: '',
                    precio_costo: '', precio_sugerido_venta: '', stock: '',
                    proveedor: '', categoria: '', imagen: '', activo: true,
                });
                // navigate('/productos'); // Opcional: Redirige
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
        const cleanedValue = parseInputNumber(value); // Obtener el string limpio

        let numericValue;
        if (name === 'stock') {
            numericValue = parseInt(cleanedValue);
        } else {
            numericValue = parseFloat(cleanedValue);
        }

        if (!isNaN(numericValue)) {
            // Actualizar el estado con el número real para cálculos, pero la visualización se maneja por 'value' prop
            setFormData(prevData => ({ ...prevData, [name]: numericValue }));
        } else if (cleanedValue === '') {
            setFormData(prevData => ({ ...prevData, [name]: '' })); // Permitir campo vacío
        } else {
            // Si el valor no es un número válido después de limpiar, mostrar error y resetear
            Swal.fire('Formato Inválido', `Por favor, introduce un número válido para "${name.replace(/_/g, ' ')}".`, 'warning');
            setFormData(prevData => ({ ...prevData, [name]: '' })); // Resetear el campo
        }
    };

    return (
        <Container
            fluid
            className="add-product-page p-4"
            style={{
                minHeight: 'calc(100vh - 56px)',
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
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
                                {/* Columna Izquierda */}
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="formReferenciaProducto">
                                        <Form.Label style={{color: '#000000'}}>Referencia Producto</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="referencia_producto"
                                            value={formData.referencia_producto}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej: PROD001"
                                            className="form-control-light"
                                        />
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

                                    <Form.Group className="mb-3" controlId="formDescripcion">
                                        <Form.Label style={{color: '#000000'}}>Descripción</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2} // <-- Descripción más pequeña
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleChange}
                                            placeholder="Descripción detallada del producto (opcional)..."
                                            className="form-control-light"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formPrecioCosto">
                                        <Form.Label style={{color: '#000000'}}>Precio Costo</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text" // <-- Cambiado a texto para formato
                                                name="precio_costo"
                                                // Mostrar formateado si es número, si no, el string tal cual para permitir edición
                                                value={
                                                    typeof formData.precio_costo === 'number'
                                                        ? formatInputNumber(formData.precio_costo)
                                                        : formData.precio_costo
                                                }
                                                onChange={handleChange}
                                                onBlur={handleBlurNumberField} // <-- Manejar el foco para formatear
                                                required
                                                placeholder="0,00" // Actualizar placeholder
                                                className="form-control-light text-end" // Alinear a la derecha
                                            />
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formPrecioSugeridoVenta">
                                        <Form.Label style={{color: '#000000'}}>Precio Sugerido Venta</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text" // <-- Cambiado a texto para formato
                                                name="precio_sugerido_venta"
                                                value={
                                                    typeof formData.precio_sugerido_venta === 'number'
                                                        ? formatInputNumber(formData.precio_sugerido_venta)
                                                        : formData.precio_sugerido_venta
                                                }
                                                onChange={handleChange}
                                                onBlur={handleBlurNumberField} // <-- Manejar el foco para formatear
                                                required
                                                placeholder="0,00"
                                                className="form-control-light text-end" // Alinear a la derecha
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>

                                {/* Columna Derecha */}
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="formStock">
                                        <Form.Label style={{color: '#000000'}}>Stock</Form.Label>
                                        <Form.Control
                                            type="text" // <-- Cambiado a texto para formato
                                            name="stock"
                                            value={
                                                typeof formData.stock === 'number'
                                                    ? formatInputNumber(formData.stock, true) // True para entero
                                                    : formData.stock
                                            }
                                            onChange={handleChange}
                                            onBlur={handleBlurNumberField} // <-- Manejar el foco para formatear
                                            required
                                            placeholder="0"
                                            className="form-control-light text-end" // Alinear a la derecha
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formProveedor">
                                        <Form.Label style={{color: '#000000'}}>Proveedor</Form.Label>
                                        <Form.Select
                                            name="proveedor"
                                            value={formData.proveedor}
                                            onChange={handleChange}
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

                                    <Form.Group className="mb-3" controlId="formCategoria">
                                        <Form.Label style={{color: '#000000'}}>Categoría</Form.Label>
                                        <Form.Select
                                            name="categoria"
                                            value={formData.categoria}
                                            onChange={handleChange}
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

                                    <Form.Group className="mb-3" controlId="formImagen">
                                        <Form.Label style={{color: '#000000'}}>URL de Imagen</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="imagen"
                                            value={formData.imagen}
                                            onChange={handleChange}
                                            placeholder="http://example.com/imagen.jpg"
                                            className="form-control-light"
                                        />
                                    </Form.Group>

                                    {formData.imagen && (
                                        <div className="text-center mb-3 image-preview-container">
                                            <img
                                                src={formData.imagen}
                                                alt="Previsualización"
                                                className="image-preview"
                                            />
                                        </div>
                                    )}

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
                                </Col>
                            </Row>

                            <Button type="submit" disabled={loading} className="btn-add-product-submit">
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
                        </Form>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default AgregarProductoPage;
