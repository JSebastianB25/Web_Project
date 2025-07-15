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
const API_MARCAS_URL = `${API_BASE_URL}/marcas/`; // Nueva URL para marcas

// --- FUNCIONES PARA MANEJO DE NÚMEROS CON SEPARADORES (AJUSTADAS LIGERAMENTE) ---
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

    // Estado para los datos del nuevo producto
    // Los campos numéricos se mantendrán como string en formData
    // para un mejor control de la entrada del usuario.
    const [formData, setFormData] = useState({
        referencia_producto: '',
        nombre: '',
        marca: '',
        precio_costo: '', // string
        precio_sugerido_venta: '', // string
        stock: '', // string
        proveedor: '',
        categoria: '',
        imagen: '',
        activo: true,
    });

    // Estados para cargar las listas de proveedores, categorías y ahora marcas
    const [providers, setProviders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Manejador de cambios para todos los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = value;

        if (type === 'checkbox') {
            newValue = checked;
        } else if (name === 'precio_costo' || name === 'precio_sugerido_venta') {
            // Permitir que el usuario escriba puntos y comas libremente mientras edita.
            // No formatear aquí, solo actualizar el string tal cual.
            newValue = value;
        } else if (name === 'stock') {
            // Para stock, solo permitir dígitos.
            newValue = value.replace(/[^0-9]/g, ''); // Eliminar todo lo que no sea dígito
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
            // Crear un objeto con los datos a enviar a la API
            const dataToSend = {
                ...formData,
                // Convertir IDs a entero o null si están vacíos
                proveedor: formData.proveedor ? parseInt(formData.proveedor) : null,
                categoria: formData.categoria ? parseInt(formData.categoria) : null,
                marca: formData.marca ? parseInt(formData.marca) : null,
                // Convertir los campos numéricos a float/int después de parsear el string
                precio_costo: parseFloat(parseInputNumber(formData.precio_costo)),
                precio_sugerido_venta: parseFloat(parseInputNumber(formData.precio_sugerido_venta)),
                stock: parseInt(parseInputNumber(formData.stock)),
            };

            // Validación más robusta para asegurar que los campos numéricos sean números válidos
            if (isNaN(dataToSend.precio_costo) || isNaN(dataToSend.precio_sugerido_venta) || isNaN(dataToSend.stock)) {
                Swal.fire('Error de Formato', 'Por favor, asegúrate de que los campos numéricos (precio costo, precio venta, stock) tengan un formato correcto.', 'error');
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
                // Limpia el formulario
                setFormData({
                    referencia_producto: '', nombre: '', marca: '',
                    precio_costo: '', precio_sugerido_venta: '', stock: '',
                    proveedor: '', categoria: '', imagen: '', activo: true,
                });
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

                                    {/* Campo para la selección de Marca */}
                                    <Form.Group className="mb-3" controlId="formMarca">
                                        <Form.Label style={{color: '#000000'}}>Marca</Form.Label>
                                        <Form.Select
                                            name="marca"
                                            value={formData.marca}
                                            onChange={handleChange}
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

                                    <Form.Group className="mb-3" controlId="formPrecioCosto">
                                        <Form.Label style={{color: '#000000'}}>Precio Costo</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                name="precio_costo"
                                                // Aquí aplicamos formatInputNumber para la visualización.
                                                // Si formData.precio_costo es un número, se formatea.
                                                // Si es un string (mientras se edita), se muestra directamente.
                                                value={typeof formData.precio_costo === 'number'
                                                    ? formatInputNumber(formData.precio_costo)
                                                    : formData.precio_costo // Si es string (editando), lo muestra tal cual
                                                }
                                                onChange={handleChange}
                                                onBlur={handleBlurNumberField} // Al perder foco, se intenta formatear y limpiar el estado
                                                required
                                                placeholder="0,00"
                                                className="form-control-light text-end"
                                                inputMode="decimal" // Sugiere teclado numérico con decimales
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
                                </Col>

                                {/* Columna Derecha */}
                                <Col md={6}>
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
                                            inputMode="numeric" // Sugiere teclado numérico sin decimales
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