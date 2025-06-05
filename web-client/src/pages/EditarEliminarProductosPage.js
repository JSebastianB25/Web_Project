// web-client/src/pages/EditarEliminarProductosPage.js

import React, { useState, useEffect } from 'react';
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
    InputGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';

// URL base de tu API de productos
const API_PRODUCTOS_URL = 'http://localhost:8000/api/productos/';
const API_CATEGORIAS_URL = 'http://localhost:8000/api/categorias/';
const API_PROVEEDORES_URL = 'http://localhost:8000/api/proveedores/';

const EditarEliminarProductosPage = () => {
    // Estados del componente
    const [searchQuery, setSearchQuery] = useState(''); // Guarda el texto de búsqueda
    const [searchResults, setSearchResults] = useState([]); // Almacena los productos encontrados
    const [selectedProduct, setSelectedProduct] = useState(null); // Producto seleccionado para editar
    const [showEditModal, setShowEditModal] = useState(false); // Controla la visibilidad del modal de edición
    const [editFormData, setEditFormData] = useState({}); // Datos del formulario de edición
    const [loading, setLoading] = useState(false); // Indica si una operación está en curso
    const [searchPerformed, setSearchPerformed] = useState(false); // Para mostrar mensaje de "no resultados" solo después de buscar

    // Estados para las listas de categorías y proveedores (para los dropdowns en el modal de edición)
    const [categories, setCategories] = useState([]);
    const [providers, setProviders] = useState([]);

    // Efecto para cargar categorías y proveedores al iniciar el componente
    useEffect(() => {
        const fetchRelatedData = async () => {
            try {
                // Realiza ambas peticiones en paralelo para mayor eficiencia
                const [categoriesRes, providersRes] = await Promise.all([
                    axios.get(API_CATEGORIAS_URL),
                    axios.get(API_PROVEEDORES_URL),
                ]);
                setCategories(categoriesRes.data);
                setProviders(providersRes.data);
            } catch (error) {
                console.error('Error al cargar categorías o proveedores:', error);
                Swal.fire('Error de Carga', 'No se pudieron cargar las listas de categorías o proveedores.', 'error');
            }
        };
        fetchRelatedData();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    // Función para manejar la búsqueda de productos
    const handleSearch = async (e) => {
        e.preventDefault(); // Previene el recargo de la página
        setLoading(true);
        setSearchPerformed(true);
        setSelectedProduct(null); // Limpia cualquier producto seleccionado previamente
        setSearchResults([]); // Limpia los resultados de búsquedas anteriores

        try {
            // Realiza la petición GET a tu API de productos con el parámetro 'search'
            // Este parámetro es manejado por el SearchFilter configurado en tu backend
            const response = await axios.get(`${API_PRODUCTOS_URL}?search=${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error al buscar productos:', error);
            Swal.fire('Error de Búsqueda', 'Hubo un problema al buscar productos. Inténtalo de nuevo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Función para seleccionar un producto y abrir el modal de edición
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        // Pre-rellena el formulario de edición con los datos del producto
        setEditFormData({
            ...product,
            // Asegúrate de que los campos de clave foránea sean solo el ID para el `select` del formulario
            proveedor: product.proveedor ? String(product.proveedor) : '',
            categoria: product.categoria ? String(product.categoria) : '',
        });
        setShowEditModal(true); // Muestra el modal
    };

    // Maneja los cambios en los campos del formulario del modal de edición
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: value,
        });
    };

    // Función para manejar la actualización de un producto
    const handleUpdateProduct = async () => {
        setLoading(true);
        try {
            // Formatea los datos antes de enviar al backend
            const dataToSend = {
                ...editFormData,
                // Convierte precios a números flotantes
                precio_costo: parseFloat(editFormData.precio_costo),
                precio_sugerido_venta: parseFloat(editFormData.precio_sugerido_venta),
                // Envía `null` si el select de proveedor o categoría está vacío
                proveedor: editFormData.proveedor || null,
                categoria: editFormData.categoria || null,
            };

            // Realiza la petición PUT (actualización completa)
            const response = await axios.put(
                `${API_PRODUCTOS_URL}${editFormData.referencia_producto}/`, // Usa la referencia como PK en la URL
                dataToSend
            );

            if (response.status === 200) { // 200 OK para actualización exitosa
                Swal.fire('¡Actualizado!', 'Producto actualizado exitosamente.', 'success');
                setShowEditModal(false); // Cierra el modal
                setSelectedProduct(null); // Deselecciona el producto

                // Vuelve a ejecutar la búsqueda para refrescar la lista con los datos actualizados
                handleSearch({ preventDefault: () => {} }); // Simula un evento para disparar la búsqueda
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            let errorMessage = 'Error al actualizar el producto. Inténtalo de nuevo.';
            if (error.response && error.response.data) {
                // Si el backend devuelve errores de validación, los muestra
                errorMessage = Object.values(error.response.data).flat().join(' ');
            }
            Swal.fire('Error de Actualización', `Detalle: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Función para manejar la eliminación de un producto
    const handleDeleteProduct = async (referencia_producto) => {
        // Pide confirmación al usuario antes de eliminar
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡Esta acción no se puede deshacer!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                try {
                    // Realiza la petición DELETE
                    const response = await axios.delete(`${API_PRODUCTOS_URL}${referencia_producto}/`);
                    if (response.status === 204) { // 204 No Content para eliminación exitosa
                        Swal.fire('¡Eliminado!', 'El producto ha sido eliminado exitosamente.', 'success');
                        setSelectedProduct(null); // Deselecciona el producto
                        // Vuelve a ejecutar la búsqueda para eliminar el producto de la lista
                        handleSearch({ preventDefault: () => {} });
                    }
                } catch (error) {
                    console.error('Error al eliminar producto:', error);
                    let errorMessage = 'Error al eliminar el producto.';
                    if (error.response && error.response.data) {
                        errorMessage = Object.values(error.response.data).flat().join(' ');
                    }
                    Swal.fire('Error de Eliminación', `Detalle: ${errorMessage}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <Container className="my-4">
            <h2 className="mb-4 text-center">Editar / Eliminar Productos</h2>
            <hr />

            {/* Sección de Búsqueda */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <FontAwesomeIcon icon={faSearch} className="me-2" /> Buscar Producto
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSearch}>
                        <InputGroup className="mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Buscar por referencia, nombre o proveedor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Campo de búsqueda de productos"
                            />
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Buscando...' : 'Buscar'}
                            </Button>
                        </InputGroup>
                    </Form>
                </Card.Body>
            </Card>

            {/* Sección de Resultados de la Búsqueda */}
            {loading && searchPerformed ? (
                <p className="text-center mt-4">Cargando productos...</p>
            ) : searchPerformed && searchResults.length === 0 ? (
                <p className="text-center mt-4 text-muted">No se encontraron productos con esa búsqueda.</p>
            ) : (
                <Row className="mt-4">
                    {searchResults.map((product) => (
                        <Col key={product.referencia_producto} sm={6} md={4} lg={3} className="mb-4">
                            <Card className={selectedProduct?.referencia_producto === product.referencia_producto ? 'border-primary border-3 shadow-lg' : 'shadow-sm h-100'}>
                                {product.imagen ? (
                                    <Card.Img
                                        variant="top"
                                        src={product.imagen}
                                        alt={product.nombre}
                                        style={{ height: '180px', objectFit: 'contain', padding: '10px', backgroundColor: '#f8f9fa' }}
                                    />
                                ) : (
                                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', color: '#6c757d', fontSize: '0.9em' }}>
                                        No hay imagen disponible
                                    </div>
                                )}
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="fw-bold text-truncate" title={product.nombre}>{product.nombre}</Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        Ref: {product.referencia_producto}
                                    </Card.Text>
                                    <Card.Text>
                                        <strong>Precio Venta:</strong> ${parseFloat(product.precio_sugerido_venta).toLocaleString('es-CO')}<br />
                                        <strong>Stock:</strong> {product.stock}<br />
                                        <strong>Proveedor:</strong> {product.proveedor_nombre ? product.proveedor_nombre : 'N/A'}<br />
                                        <strong>Categoría:</strong> {product.categoria_nombre ? product.categoria_nombre : 'N/A'}
                                    </Card.Text>
                                    <div className="mt-auto d-flex justify-content-between">
                                        <Button
                                            variant="info"
                                            className="flex-fill me-2"
                                            onClick={() => handleSelectProduct(product)}
                                            disabled={loading}
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> Editar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="flex-fill"
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

            {/* Modal de Edición del Producto */}
            {selectedProduct && ( // Solo renderiza el modal si hay un producto seleccionado
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Editar Producto: {selectedProduct.nombre}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Referencia Producto</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="referencia_producto"
                                            value={editFormData.referencia_producto || ''}
                                            disabled // La PK generalmente no se edita
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nombre</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={editFormData.nombre || ''}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Descripción</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="descripcion"
                                            value={editFormData.descripcion || ''}
                                            onChange={handleEditChange}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Precio Costo</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>$</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                step="0.01" // Permite decimales
                                                name="precio_costo"
                                                value={editFormData.precio_costo || ''}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Precio Sugerido Venta</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>$</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="precio_sugerido_venta"
                                                value={editFormData.precio_sugerido_venta || ''}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Stock</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="stock"
                                            value={editFormData.stock || ''}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Proveedor</Form.Label>
                                        <Form.Select
                                            name="proveedor"
                                            value={editFormData.proveedor || ''}
                                            onChange={handleEditChange}
                                            required
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
                                        <Form.Label>Categoría</Form.Label>
                                        <Form.Select
                                            name="categoria"
                                            value={editFormData.categoria || ''}
                                            onChange={handleEditChange}
                                            required
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
                                        <Form.Label>URL de Imagen</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="imagen"
                                            value={editFormData.imagen || ''}
                                            onChange={handleEditChange}
                                        />
                                    </Form.Group>
                                    {editFormData.imagen && (
                                        <div className="text-center mb-3">
                                            <img
                                                src={editFormData.imagen}
                                                alt="Previsualización"
                                                style={{ maxWidth: '100%', height: '150px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '5px' }}
                                            />
                                        </div>
                                    )}
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Activo"
                                            name="activo"
                                            checked={editFormData.activo || false}
                                            onChange={(e) => setEditFormData({ ...editFormData, activo: e.target.checked })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading}>
                            <FontAwesomeIcon icon={faTimes} /> Cerrar
                        </Button>
                        <Button variant="primary" onClick={handleUpdateProduct} disabled={loading}>
                            {loading ? 'Actualizando...' : <><FontAwesomeIcon icon={faEdit} /> Guardar Cambios</>}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
};

export default EditarEliminarProductosPage;