// web-client/src/pages/ProductosPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Card, Form, InputGroup, Button, Spinner,
    Alert // Agregado: Alert para mensajes de estado
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faTimes, faInfoCircle,
    faBoxesStacked // Agregado: Nuevo icono para el título de la página
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';

// Importa tus estilos personalizados para esta página
import '../styles/ProductosPage.css'; // Nuevo archivo CSS

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;

const ProductosPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado para la barra de búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Función para cargar productos
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_PRODUCTOS_URL}`;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log('🔗 URL de la Petición de Productos:', url);
            const response = await axios.get(url);
            console.log('📦 Datos Crudos de la API de Productos (Frontend):', response.data);

            setProducts(response.data || []);

        } catch (err) {
            console.error('❌ Error al cargar productos en el frontend:', err.response ? err.response.data : err.message);
            setError('No se pudieron cargar los productos. Verifica tu conexión o el servidor.');
            Swal.fire('Error', 'No se pudieron cargar los productos.', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]); // La dependencia ahora es solo searchTerm

    // Ejecutar fetchProducts cuando cambian las dependencias
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Manejador de cambio para la barra de búsqueda
    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    // Manejador para limpiar la barra de búsqueda
    const handleClearSearch = () => {
        setSearchTerm('');
    };

    return (
        <Container
            fluid // Asegura que ocupe todo el ancho
            className="productos-page p-4" // Clase para estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faBoxesStacked} className="me-3" /> Todos los Productos
            </h2>

            {/* Sección de Búsqueda */}
            <Row className="mb-4 justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm productos-search-card"> {/* Nueva clase para la tarjeta de búsqueda */}
                        <Card.Body className="d-flex align-items-center">
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar por referencia, nombre o descripción..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="form-control-light" // Clase de estilo
                                />
                                <Button variant="primary" onClick={fetchProducts} className="btn-search-product"> {/* Clase de estilo */}
                                    <FontAwesomeIcon icon={faSearch} />
                                </Button>
                                {searchTerm && ( // Solo muestra el botón limpiar si hay algo en la búsqueda
                                    <Button variant="outline-danger" onClick={handleClearSearch} title="Limpiar Búsqueda" className="btn-clear-search"> {/* Clase de estilo */}
                                        <FontAwesomeIcon icon={faTimes} />
                                    </Button>
                                )}
                            </InputGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Mensajes de estado */}
            {loading && (
                <div className="text-center my-4">
                    <Spinner animation="border" role="status" style={{ color: '#00b45c' }}> {/* Color del spinner */}
                        <span className="visually-hidden">Cargando productos...</span>
                    </Spinner>
                    <p className="mt-2" style={{ color: '#000000'}}>Cargando productos...</p> {/* Color del texto */}
                </div>
            )}
            {error && (
                <Alert variant="danger" className="text-center productos-alert-error"> {/* Clase de estilo */}
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" /> {error}
                </Alert>
            )}
            {!loading && !error && products.length === 0 && (
                <Alert variant="info" className="text-center productos-alert-info"> {/* Clase de estilo */}
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" /> No se encontraron productos con los criterios de búsqueda.
                </Alert>
            )}

            {/* Listado de Productos en Cards */}
            {!loading && !error && products.length > 0 && (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4"> {/* Ajuste para más columnas en pantallas grandes */}
                    {products.map(product => {
                        // Lógica para construir la URL completa de la imagen
                        let displayImageUrl = '';
                        if (product.imagen) {
                            // Si la imagen es una ruta relativa, construir la URL completa
                            // Asumimos que MEDIA_URL es '/media/' y tu API_BASE_URL es 'http://localhost:8000/api'
                            // Entonces la base para media es 'http://localhost:8000'
                            displayImageUrl = product.imagen.startsWith('http')
                                ? product.imagen
                                : `${API_BASE_URL.replace('/api', '')}${product.imagen}`;
                        }

                        return (
                            <Col key={product.referencia_producto}>
                                <Card className="h-100 shadow-sm productos-card"> {/* Nueva clase para la tarjeta de producto */}
                                    <Card.Img
                                        variant="top"
                                        src={displayImageUrl || 'https://placehold.co/200x200/e0e0e0/555555?text=Sin+Imagen'} // Fallback mejorado
                                        alt={product.nombre}
                                        className="productos-card-img" // Nueva clase para la imagen
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x200/e0e0e0/555555?text=Sin+Imagen'; }} // Fallback en error
                                    />
                                    <Card.Body className="d-flex flex-column productos-card-body"> {/* Nueva clase */}
                                        <Card.Title className="fw-bold text-truncate productos-card-title" title={product.nombre}>
                                            {product.nombre}
                                        </Card.Title>
                                        <Card.Text className="text-muted small mb-2 productos-card-ref"> {/* Nueva clase */}
                                            Ref: {product.referencia_producto}
                                        </Card.Text>
                                        <Card.Text className="flex-grow-1 productos-card-details"> {/* Nueva clase */}
                                            <strong>Precio Venta:</strong> ${parseFloat(product.precio_sugerido_venta).toLocaleString('es-CO')}<br />
                                            <strong>Stock:</strong> {product.stock}<br />
                                            <strong>Proveedor:</strong> {product.proveedor_nombre || 'N/A'}<br />
                                            <strong>Categoría:</strong> {product.categoria_nombre || 'N/A'}<br />
                                            <strong>Marca:</strong> {product.marca_nombre || 'N/A'} {/* ¡Campo de Marca Agregado! */}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default ProductosPage;
