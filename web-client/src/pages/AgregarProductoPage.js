// web-client/src/pages/AgregarProductoPage.js

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // Para redireccionar después de agregar

// Define tus URLs de API
const API_BASE_URL = 'http://localhost:8000/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos/`;
const API_PROVEEDORES_URL = `${API_BASE_URL}/proveedores/`;
const API_CATEGORIAS_URL = `${API_BASE_URL}/categorias/`;

const AgregarProductoPage = () => {
    const navigate = useNavigate(); // Hook para la navegación programática

    // Estado para los datos del nuevo producto
    const [formData, setFormData] = useState({
        referencia_producto: '',
        nombre: '',
        descripcion: '',
        precio_costo: '',
        precio_sugerido_venta: '',
        stock: '',
        proveedor: '', // Guardará el ID del proveedor (string)
        categoria: '', // Guardará el ID de la categoría (string)
        imagen: '',
        activo: true, // Por defecto, un producto nuevo estará activo
    });

    // Estados para cargar las listas de proveedores y categorías
    const [providers, setProviders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false); // Estado para el indicador de carga
    const [error, setError] = useState(null); // Estado para manejar errores

    // useEffect para cargar proveedores y categorías cuando el componente se monta
    useEffect(() => {
        const fetchRelatedData = async () => {
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
            }
        };
        fetchRelatedData();
    }, []); // El array vacío asegura que se ejecuta solo una vez al montar

    // Manejador de cambios para todos los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        setLoading(true);
        setError(null);

        try {
            // Prepara los datos para enviar
            const dataToSend = {
                ...formData,
                // Convierte los IDs de proveedor/categoría a número o null si están vacíos.
                // DRF espera un número para PrimaryKeyRelatedField.
                proveedor: formData.proveedor ? parseInt(formData.proveedor) : null,
                categoria: formData.categoria ? parseInt(formData.categoria) : null,
                // Asegúrate de que los precios y stock sean números
                precio_costo: parseFloat(formData.precio_costo),
                precio_sugerido_venta: parseFloat(formData.precio_sugerido_venta),
                stock: parseInt(formData.stock),
            };

            // Realiza la petición POST a tu API
            const response = await axios.post(API_PRODUCTOS_URL, dataToSend);

            if (response.status === 201) { // 201 Created es el código de éxito para POST
                Swal.fire(
                    '¡Producto Agregado!',
                    'El producto se ha agregado exitosamente.',
                    'success'
                );
                // Opcional: Limpia el formulario o redirige
                setFormData({ // Limpia el formulario
                    referencia_producto: '', nombre: '', descripcion: '',
                    precio_costo: '', precio_sugerido_venta: '', stock: '',
                    proveedor: '', categoria: '', imagen: '', activo: true,
                });
                navigate('/productos'); // Redirige a la lista de productos
            } else {
                Swal.fire('Error', 'Hubo un problema al agregar el producto.', 'error');
            }

        } catch (err) {
            console.error('Error al agregar producto:', err.response ? err.response.data : err);
            // Muestra un mensaje de error más específico si viene de la API
            const errorMessage = err.response && err.response.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Ocurrió un error inesperado al agregar el producto.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Agregar Nuevo Producto</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <Form onSubmit={handleSubmit}>
                <Row>
                    {/* Columna Izquierda */}
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="formReferenciaProducto">
                            <Form.Label>Referencia Producto</Form.Label>
                            <Form.Control
                                type="text"
                                name="referencia_producto"
                                value={formData.referencia_producto}
                                onChange={handleChange}
                                required
                                placeholder="Ej: PROD001"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formNombre">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Camiseta Algodón"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formDescripcion">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                placeholder="Descripción detallada del producto..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formPrecioCosto">
                            <Form.Label>Precio Costo</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>$</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="precio_costo"
                                    value={formData.precio_costo}
                                    onChange={handleChange}
                                    required
                                    placeholder="0.00"
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formPrecioSugeridoVenta">
                            <Form.Label>Precio Sugerido Venta</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>$</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="precio_sugerido_venta"
                                    value={formData.precio_sugerido_venta}
                                    onChange={handleChange}
                                    required
                                    placeholder="0.00"
                                />
                            </InputGroup>
                        </Form.Group>
                    </Col>

                    {/* Columna Derecha */}
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="formStock">
                            <Form.Label>Stock</Form.Label>
                            <Form.Control
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                placeholder="0"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formProveedor">
                            <Form.Label>Proveedor</Form.Label>
                            <Form.Select
                                name="proveedor"
                                value={formData.proveedor} // El valor debe ser el ID del proveedor seleccionado
                                onChange={handleChange}
                                required // Si es obligatorio
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
                            <Form.Label>Categoría</Form.Label>
                            <Form.Select
                                name="categoria"
                                value={formData.categoria} // El valor debe ser el ID de la categoría seleccionada
                                onChange={handleChange}
                                required // Si es obligatorio
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
                            <Form.Label>URL de Imagen</Form.Label>
                            <Form.Control
                                type="text"
                                name="imagen"
                                value={formData.imagen}
                                onChange={handleChange}
                                placeholder="http://example.com/imagen.jpg"
                            />
                        </Form.Group>

                        {formData.imagen && (
                            <div className="text-center mb-3">
                                <img
                                    src={formData.imagen}
                                    alt="Previsualización"
                                    style={{ maxWidth: '100%', height: '150px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '5px' }}
                                />
                            </div>
                        )}

                        <Form.Group className="mb-3" controlId="formActivo">
                            <Form.Check
                                type="checkbox"
                                label="Activo"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={loading}>
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
        </Container>
    );
};

export default AgregarProductoPage;