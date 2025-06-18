// web-client/src/pages/EditarEliminarProductosPage.js

import React, { useState, useEffect, useCallback } from 'react'; // Asegura que useCallback esté importado
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
    Spinner, // <<-- AÑADIDO: Para el spinner de carga inicial
    Alert   // <<-- AÑADIDO: Para mostrar mensajes de error/información si es necesario
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faTimes, faBoxOpen, faSpinner } from '@fortawesome/free-solid-svg-icons'; // <<-- AÑADIDO: faBoxOpen para el título, faSpinner para botones de carga

// Importa tus estilos personalizados para esta página
import '../styles/EditarProductosPage.css'; // Nuevo archivo CSS para los estilos

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
    const [loading, setLoading] = useState(false); // Indica si una operación está en curso (búsqueda, actualización, eliminación)
    const [pageLoading, setPageLoading] = useState(true); // <<-- AÑADIDO: Nuevo estado para la carga inicial de la página (categorías/proveedores)
    const [searchPerformed, setSearchPerformed] = useState(false); // Para mostrar mensaje de "no resultados" solo después de buscar

    // Estados para las listas de categorías y proveedores (para los dropdowns en el modal de edición)
    const [categories, setCategories] = useState([]);
    const [providers, setProviders] = useState([]);

    // Efecto para cargar categorías y proveedores al iniciar el componente
    useEffect(() => {
        const fetchRelatedData = async () => {
            setPageLoading(true); // <<-- AÑADIDO: Inicia la carga de la página
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
            } finally {
                setPageLoading(false); // <<-- AÑADIDO: Finaliza la carga de la página
            }
        };
        fetchRelatedData();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    // Función para manejar la búsqueda de productos
    // <<-- MODIFICADO: Envuelto en useCallback para optimización y manejo de dependencia
    const handleSearch = useCallback(async (e) => {
        if (e) e.preventDefault(); // Previene el recargo de la página solo si hay un evento
        setLoading(true);
        setSearchPerformed(true);
        setSelectedProduct(null); // Limpia cualquier producto seleccionado previamente
        setSearchResults([]); // Limpia los resultados de búsquedas anteriores

        try {
            // Realiza la petición GET a tu API de productos con el parámetro 'search'
            const response = await axios.get(`${API_PRODUCTOS_URL}?search=${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error al buscar productos:', error);
            Swal.fire('Error de Búsqueda', 'Hubo un problema al buscar productos. Inténtalo de nuevo.', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]); // <<-- Dependencia de searchQuery para useCallback

    // <<-- AÑADIDO: Carga inicial de todos los productos (sin término de búsqueda)
    useEffect(() => {
        // Ejecuta handleSearch con un evento simulado para cargar todos los productos al inicio
        // Esto es si `searchQuery` está vacío.
        if (searchQuery === '') {
            handleSearch({ preventDefault: () => {} });
        }
    }, [handleSearch, searchQuery]);


    // Función para seleccionar un producto y abrir el modal de edición
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        // Pre-rellena el formulario de edición con los datos del producto
        setEditFormData({
            ...product,
            // Asegúrate de que los campos de clave foránea sean solo el ID para el `select` del formulario
            proveedor: product.proveedor && typeof product.proveedor === 'object' && product.proveedor.id ? String(product.proveedor.id) : (product.proveedor ? String(product.proveedor) : ''),
            categoria: product.categoria && typeof product.categoria === 'object' && product.categoria.id ? String(product.categoria.id) : (product.categoria ? String(product.categoria) : ''),
            // Asegura que estas propiedades existan o sean cadenas vacías para evitar errores
            descripcion: product.descripcion || '',
            imagen: product.imagen || '',
            activo: product.activo || false,
        });
        setShowEditModal(true); // Muestra el modal
    };

    // Maneja los cambios en los campos del formulario del modal de edición
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target; // <<-- AÑADIDO: type y checked para checkbox
        let newValue = value;

        // <<-- AÑADIDO: Lógica para checkbox
        if (type === 'checkbox') {
            newValue = checked;
        }

        setEditFormData({
            ...editFormData,
            [name]: newValue,
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
                // <<-- AÑADIDO: Conversión de stock a entero
                stock: parseInt(editFormData.stock),
                // Envía `null` si el select de proveedor o categoría está vacío
                proveedor: editFormData.proveedor ? parseInt(editFormData.proveedor) : null, // <<-- CONVERTIR a int
                categoria: editFormData.categoria ? parseInt(editFormData.categoria) : null, // <<-- CONVERTIR a int
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
            text: '¡Esta acción no se puede deshacer! Si el producto tiene facturas asociadas, no podrá ser eliminado.', // <<-- MENSAJE CLARO
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // <<-- CAMBIADO: Rojo para eliminar
            cancelButtonColor: '#6c757d', // <<-- CAMBIADO: Gris para cancelar
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
                    console.error('Error al eliminar producto:', error.response ? error.response.data : error.message);
                    let errorMessage = 'No es posible eliminar el producto porque tiene facturas asociadas.';
                    
                    // --- MANEJO ESPECÍFICO DE ERROR POR FACTURAS ASOCIADAS ---
                    if (error.response && error.response.status === 400) { // Bad Request, puede contener mensaje específico
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
                    } else if (error.response && error.response.status === 409) { // Conflict
                         errorMessage = 'No es posible eliminar el producto porque tiene facturas asociadas.';
                    } else if (error.message.includes('Network Error')) {
                        errorMessage = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
                    }
                    // --- FIN MANEJO ESPECÍFICO ---

                    Swal.fire('Error de Eliminación', `Detalle: ${errorMessage}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <Container 
            fluid // Asegura que ocupe todo el ancho
            className="edit-delete-products-page p-4" // Clases de padding y estilos base
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2 className="mb-4 text-center" style={{ color: '#000000', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faBoxOpen} className="me-3" /> Editar / Eliminar Productos
            </h2>
            {/* Spinner de carga inicial para categorías/proveedores */}
            {pageLoading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" style={{ color: '#00b45c' }}>
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2" style={{ color: '#000000' }}>Cargando datos necesarios...</p>
                </div>
            ) : (
                <> {/* Fragmento para envolver el contenido una vez que pageLoading es falso */}
                    {/* Sección de Búsqueda */}
                    <Card className="mb-4 shadow-sm edit-delete-card"> {/* Clase para estilo de tarjeta */}
                        <Card.Header className="edit-delete-card-header"> {/* Clase para el header de la tarjeta */}
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
                                        className="form-control-light" // Clase de estilo
                                    />
                                    <Button variant="primary" type="submit" disabled={loading} className="btn-search-product"> {/* Clase de estilo */}
                                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Buscar'} {/* Usar faSpinner aquí */}
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
                                    <Card className={selectedProduct?.referencia_producto === product.referencia_producto ? 'product-card-selected' : 'product-card'}> {/* Clases de estilo */}
                                        {product.imagen ? (
                                            <Card.Img
                                                variant="top"
                                                src={product.imagen}
                                                alt={product.nombre}
                                                className="product-card-img" // Clase de estilo
                                            />
                                        ) : (
                                            <div className="product-card-img-placeholder"> {/* Clase de estilo */}
                                                No hay imagen disponible
                                            </div>
                                        )}
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title className="fw-bold text-truncate product-card-title" title={product.nombre}>{product.nombre}</Card.Title> {/* Clase de estilo */}
                                            <Card.Text className="text-muted small mb-2 product-card-text"> {/* Clase de estilo */}
                                                Ref: {product.referencia_producto}
                                            </Card.Text>
                                            <Card.Text className="product-card-text"> {/* Clase de estilo */}
                                                <strong>Precio Venta:</strong> ${parseFloat(product.precio_sugerido_venta).toLocaleString('es-CO')}<br /> {/* Formateado */}
                                                <strong>Stock:</strong> {product.stock}<br /> {/* Mantener como estaba */}
                                                <strong>Proveedor:</strong> {product.proveedor_nombre ? product.proveedor_nombre : 'N/A'}<br />
                                                <strong>Categoría:</strong> {product.categoria_nombre ? product.categoria_nombre : 'N/A'}
                                            </Card.Text>
                                            <div className="mt-auto d-flex justify-content-between">
                                                <Button
                                                    variant="info"
                                                    className="flex-fill me-2 btn-action-edit" // Clase de estilo
                                                    onClick={() => handleSelectProduct(product)}
                                                    disabled={loading}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    className="flex-fill btn-action-delete" // Clase de estilo
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
            {selectedProduct && ( // Solo renderiza el modal si hay un producto seleccionado
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                    <Modal.Header closeButton className="modal-header-light"> {/* Clase de estilo */}
                        <Modal.Title className="modal-title-light">Editar Producto: {selectedProduct.nombre}</Modal.Title> {/* Clase de estilo */}
                    </Modal.Header>
                    <Modal.Body className="modal-body-light"> {/* Clase de estilo */}
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Referencia Producto</Form.Label> {/* Color negro */}
                                        <Form.Control
                                            type="text"
                                            name="referencia_producto"
                                            value={editFormData.referencia_producto || ''}
                                            disabled // La PK generalmente no se edita
                                            className="form-control-light" // Clase de estilo
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Nombre</Form.Label> {/* Color negro */}
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            value={editFormData.nombre || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-control-light" // Clase de estilo
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Descripción</Form.Label> {/* Color negro */}
                                        <Form.Control
                                            as="textarea"
                                            rows={2} // <<-- DESCRIPCIÓN MÁS PEQUEÑA
                                            name="descripcion"
                                            value={editFormData.descripcion || ''}
                                            onChange={handleEditChange}
                                            className="form-control-light" // Clase de estilo
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Precio Costo</Form.Label> {/* Color negro */}
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text> {/* Clase de estilo */}
                                            <Form.Control
                                                type="number" // Mantener type="number" como en tu original
                                                step="0.01" // Permite decimales
                                                name="precio_costo"
                                                value={editFormData.precio_costo || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="form-control-light text-end" // Clase de estilo y alineación
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Precio Sugerido Venta</Form.Label> {/* Color negro */}
                                        <InputGroup>
                                            <InputGroup.Text className="input-group-text-light">$</InputGroup.Text> {/* Clase de estilo */}
                                            <Form.Control
                                                type="number" // Mantener type="number" como en tu original
                                                step="0.01"
                                                name="precio_sugerido_venta"
                                                value={editFormData.precio_sugerido_venta || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="form-control-light text-end" // Clase de estilo y alineación
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Stock</Form.Label> {/* Color negro */}
                                        <Form.Control
                                            type="number" // Mantener type="number" como en tu original
                                            name="stock"
                                            value={editFormData.stock || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-control-light text-end" // Clase de estilo y alineación
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{color: '#000000'}}>Proveedor</Form.Label> {/* Color negro */}
                                        <Form.Select
                                            name="proveedor"
                                            value={editFormData.proveedor || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-select-light" // Clase de estilo
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
                                        <Form.Label style={{color: '#000000'}}>Categoría</Form.Label> {/* Color negro */}
                                        <Form.Select
                                            name="categoria"
                                            value={editFormData.categoria || ''}
                                            onChange={handleEditChange}
                                            required
                                            className="form-select-light" // Clase de estilo
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
                                        <Form.Label style={{color: '#000000'}}>URL de Imagen</Form.Label> {/* Color negro */}
                                        <Form.Control
                                            type="text"
                                            name="imagen"
                                            value={editFormData.imagen || ''}
                                            onChange={handleEditChange}
                                            className="form-control-light" // Clase de estilo
                                        />
                                    </Form.Group>
                                    {editFormData.imagen && (
                                        <div className="text-center mb-3 image-preview-container"> {/* Clase de estilo */}
                                            <img
                                                src={editFormData.imagen}
                                                alt="Previsualización"
                                                className="image-preview" // Clase de estilo
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
                                            className="form-check-light" // Clase de estilo
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="modal-footer-light"> {/* Clase de estilo */}
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading} className="btn-close-modal"> {/* Clase de estilo */}
                            <FontAwesomeIcon icon={faTimes} /> Cerrar
                        </Button>
                        <Button variant="primary" onClick={handleUpdateProduct} disabled={loading} className="btn-save-product-submit"> {/* Clase de estilo */}
                            {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Actualizando...</> : <><FontAwesomeIcon icon={faEdit} /> Guardar Cambios</>} {/* Usar faSpinner aquí */}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
};

export default EditarEliminarProductosPage;
