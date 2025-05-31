// web-client/src/pages/AgregarProductoPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Importa los componentes de react-bootstrap que vamos a usar
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Card,
  InputGroup
} from 'react-bootstrap'; // Importamos lo necesario de react-bootstrap

const API_BASE_URL = 'http://localhost:8000/api'; // Asegúrate que esta URL es correcta

const AgregarProductoPage = () => {
  const [formData, setFormData] = useState({
    referencia_producto: '',
    nombre: '',
    descripcion: '',
    precio_costo: '',
    precio_sugerido_venta: '',
    stock: '',
    proveedor: '', // ID del proveedor
    categoria: '', // ID de la categoría
    imagen: '',
    activo: true,
  });

  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [proveedoresRes, categoriasRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/proveedores/`),
          axios.get(`${API_BASE_URL}/categorias/`),
        ]);
        setProveedores(proveedoresRes.data);
        setCategorias(categoriasRes.data);
      } catch (err) {
        console.error('Error al cargar datos para los dropdowns:', err);
        setError('Error al cargar proveedores o categorías. Por favor, intenta recargar la página.');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const dataToSend = {
      ...formData,
      precio_costo: parseFloat(formData.precio_costo),
      precio_sugerido_venta: parseFloat(formData.precio_sugerido_venta),
      stock: parseInt(formData.stock, 10),
      proveedor: formData.proveedor,
      categoria: formData.categoria,
    };

    try {
      await axios.post(`${API_BASE_URL}/productos/`, dataToSend);
      setSuccess('Producto agregado exitosamente!');
      // Limpiar el formulario después del éxito
      setFormData({
        referencia_producto: '',
        nombre: '',
        descripcion: '',
        precio_costo: '',
        precio_sugerido_venta: '',
        stock: '',
        proveedor: '',
        categoria: '',
        imagen: '',
        activo: true,
      });
    } catch (err) {
      console.error('Error al agregar producto:', err.response ? err.response.data : err.message);
      const errorMsg = err.response && err.response.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Error al agregar el producto. Inténtalo de nuevo.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      referencia_producto: '',
      nombre: '',
      descripcion: '',
      precio_costo: '',
      precio_sugerido_venta: '',
      stock: '',
      proveedor: '',
      categoria: '',
      imagen: '',
      activo: true,
    });
    setError('');
    setSuccess('');
  };

  return (
    <Container className="my-4"> {/* Agregamos margen vertical */}
      <Card className="shadow-lg rounded-lg"> {/* Usamos Card de react-bootstrap para un efecto de "Paper" */}
        <Card.Body className="p-4 p-md-5">
          <h1 className="text-center mb-4 text-primary fw-bold border-bottom pb-2">
            Agregar Nuevo Producto
          </h1>

          {/* Mensajes de éxito/error */}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          {loadingDropdowns ? (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
              <Spinner animation="border" variant="primary" className="mb-2" style={{ width: '3rem', height: '3rem' }} />
              <p className="text-secondary">Cargando datos esenciales...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Row className="g-3 mb-4"> {/* Usamos Row y Col de react-bootstrap para el grid */}
                <Col md={6}> {/* Media devices: 6 columnas, ocupa la mitad */}
                  <Form.Group controlId="formReferenciaProducto">
                    <Form.Label>Referencia del Producto <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="referencia_producto"
                      value={formData.referencia_producto}
                      onChange={handleChange}
                      required
                      placeholder="Ej: PROD001"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formNombreProducto">
                    <Form.Label>Nombre del Producto <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Laptop Gamer X"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}> {/* Ocupa todo el ancho en todas las pantallas */}
                  <Form.Group controlId="formDescripcion">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Una breve descripción del producto..."
                    />
                  </Form.Group>
                </Col>
                <Col md={4}> {/* 3 columnas en pantallas medianas */}
                  <Form.Group controlId="formPrecioCosto">
                    <Form.Label>Precio de Costo <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="precio_costo"
                      value={formData.precio_costo}
                      onChange={handleChange}
                      required
                      step="0.01"
                      placeholder="0.00"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="formPrecioSugeridoVenta">
                    <Form.Label>Precio Sugerido de Venta <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="precio_sugerido_venta"
                      value={formData.precio_sugerido_venta}
                      onChange={handleChange}
                      required
                      step="0.01"
                      placeholder="0.00"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="formStock">
                    <Form.Label>Stock <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formProveedor">
                    <Form.Label>Proveedor <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="proveedor"
                      value={formData.proveedor}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona un proveedor</option>
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.nombre}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formCategoria">
                    <Form.Label>Categoría <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group controlId="formImagen">
                    <Form.Label>URL de Imagen (opcional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="imagen"
                      value={formData.imagen}
                      onChange={handleChange}
                      placeholder="Ej: http://ejemplo.com/imagen.jpg"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    id="formActivo"
                    name="activo"
                    label="Producto Activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </Col>
              </Row>

              {/* Botones de acción */}
              <div className="d-flex justify-content-center gap-3 mt-4">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || loadingDropdowns}
                  className="px-4 py-2" // Clases de Bootstrap para padding
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2" // Margen a la derecha del spinner
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      {/* Icono de guardar (ejemplo SVG simple) */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-save me-2" viewBox="0 0 16 16">
                        <path d="M.5 1a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5zm-.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H0zM13 1h-.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zM.5 15a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5zm-.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H0zM13 15h-.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zm.5 8.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 0-1H13zM.5 1a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H.5z"/>
                        <path d="M8 11.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h1z"/>
                        <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
                        <path d="M10 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                      </svg>
                      Guardar Producto
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="px-4 py-2"
                >
                  {/* Icono de limpiar (ejemplo SVG simple) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg me-2" viewBox="0 0 16 16">
                    <path d="M2.146 2.146a.5.5 0 0 1 .708 0L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854a.5.5 0 0 1 0-.708z"/>
                  </svg>
                  Limpiar Formulario
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AgregarProductoPage;