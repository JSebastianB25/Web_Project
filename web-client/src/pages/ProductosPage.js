// web-client/src/pages/ProductosPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons'; // Eliminamos faFilter
import axios from 'axios';
import Swal from 'sweetalert2';

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
// Ya no necesitamos las URLs de proveedores y categorías aquí si no vamos a filtrarlas
// const API_PROVEEDORES_URL = `${API_BASE_URL}/proveedores/`;
// const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias/`;

const ProductosPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado para la barra de búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Eliminamos los estados para proveedores y categorías, ya no los necesitamos en esta UI
    // const [selectedProveedor, setSelectedProveedor] = useState('');
    // const [selectedCategoria, setSelectedCategoria] = useState('');
    // const [providers, setProviders] = useState([]);
    // const [categories, setCategories] = useState([]);

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

    // Eliminamos el useEffect para cargar proveedores y categorías, ya no es necesario
    /*
    useEffect(() => {
        const fetchRelatedData = async () => {
            try {
                const [providersRes, categoriesRes] = await Promise.all([
                    axios.get(API_PROVEEDORES_URL),
                    axios.get(API_CATEGORIAS_URL),
                ]);
                setProviders(providersRes.data);
                setCategories(categoriesRes.data);
                console.log('Proveedores cargados para filtros:', providersRes.data);
                console.log('Categorías cargadas para filtros:', categoriesRes.data);
            } catch (err) {
                console.error('Error al cargar listas relacionadas para filtros:', err);
            }
        };
        fetchRelatedData();
    }, []);
    */

    // Ejecutar fetchProducts cuando cambian las dependencias
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Manejador de cambio para la barra de búsqueda
    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    // Manejador para limpiar la barra de búsqueda
    const handleClearSearch = () => { // Renombrado de handleClearFilters
        setSearchTerm('');
        // Ya no hay filtros de proveedor/categoría que limpiar
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Todos los Productos</h2>

            {/* Sección de Búsqueda */}
            <Row className="mb-4 justify-content-center">
                <Col md={8}>
                    <InputGroup className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Buscar por referencia, nombre o descripción..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <Button variant="outline-secondary" onClick={fetchProducts}>
                            <FontAwesomeIcon icon={faSearch} />
                        </Button>
                        {searchTerm && ( // Solo muestra el botón limpiar si hay algo en la búsqueda
                            <Button variant="outline-danger" onClick={handleClearSearch} title="Limpiar Búsqueda">
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        )}
                    </InputGroup>
                </Col>
            </Row>
            {/* Eliminamos las filas de filtros de proveedor y categoría */}
            {/* <Row className="mb-4 justify-content-center"> ... </Row> */}

            {/* Mensajes de estado */}
            {loading && (
                <div className="text-center my-4">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando productos...</span>
                    </Spinner>
                    <p>Cargando productos...</p>
                </div>
            )}
            {error && (
                <div className="alert alert-danger text-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" /> {error}
                </div>
            )}
            {!loading && !error && products.length === 0 && (
                <div className="alert alert-info text-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" /> No se encontraron productos con los criterios de búsqueda.
                </div>
            )}

            {/* Listado de Productos en Cards */}
            {!loading && !error && products.length > 0 && (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {products.map(product => (
                        <Col key={product.referencia_producto}>
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Img
                                    variant="top"
                                    src={product.imagen || 'https://via.placeholder.com/150'}
                                    alt={product.nombre}
                                    style={{ height: '200px', objectFit: 'contain', padding: '10px' }}
                                />
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="fw-bold text-truncate" title={product.nombre}>
                                        {product.nombre}
                                    </Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        Ref: {product.referencia_producto}
                                    </Card.Text>
                                    <Card.Text className="flex-grow-1">
                                        <strong>Precio Venta:</strong> ${parseFloat(product.precio_sugerido_venta).toLocaleString('es-CO')}<br />
                                        <strong>Stock:</strong> {product.stock}<br />
                                        <strong>Proveedor:</strong> {product.proveedor_nombre || 'N/A'}<br />
                                        <strong>Categoría:</strong> {product.categoria_nombre || 'N/A'}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default ProductosPage;