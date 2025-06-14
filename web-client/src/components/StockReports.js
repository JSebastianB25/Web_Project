// src/components/StockReports.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, Table, Alert, Spinner, Form, Row, Col, Button } from 'react-bootstrap'; // Añadimos Form, Row, Col, Button
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:8000/api';

// Función de ayuda para formatear números enteros
const formatQuantity = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO').format(value); // Ajusta 'es-CO' a tu configuración regional
};

const StockReports = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockThreshold, setStockThreshold] = useState(10); // Nuevo estado para el umbral de stock, por defecto 10

  const fetchLowStockProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Envía el umbral de stock como un parámetro de consulta
      const response = await axios.get(`${API_BASE_URL}/reportes/productos-bajo-stock/?umbral=${stockThreshold}`);
      setLowStockProducts(response.data);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      setError('No se pudieron cargar los productos con bajo stock. Inténtalo de nuevo más tarde.');
      Swal.fire('Error', 'No se pudieron cargar los productos con bajo stock. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setLoading(false);
    }
  }, [stockThreshold]); // Dependencia del umbral para que se recargue al cambiarlo

  useEffect(() => {
    fetchLowStockProducts();
  }, [fetchLowStockProducts]);

  const handleThresholdChange = (e) => {
    setStockThreshold(e.target.value);
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-danger text-white">
        <h4 className="mb-0">Reporte de Stock Crítico</h4>
        <p className="mb-0 text-white-50">Identifica productos con stock menor o igual al umbral seleccionado.</p>
      </Card.Header>
      <Card.Body>
        <Row className="align-items-end mb-3">
          <Col md={6}>
            <Form.Group controlId="stockThreshold">
              <Form.Label>Mostrar productos con stock hasta:</Form.Label>
              <Form.Control
                type="number"
                value={stockThreshold}
                onChange={handleThresholdChange}
                min="0"
                step="1"
                placeholder="Ej: 5"
              />
              <Form.Text className="text-muted">
                Solo se mostrarán productos con stock igual o menor a este valor.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex justify-content-end align-items-end">
            <Button variant="danger" onClick={fetchLowStockProducts} disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Aplicar Filtro'}
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-2" />
            <p>Cargando productos con bajo stock...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : lowStockProducts.length === 0 ? (
          <Alert variant="success" className="text-center">
            ¡Excelente! No hay productos con stock igual o menor a {stockThreshold} en este momento.
          </Alert>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id_producto} className={product.stock_actual === 0 ? 'table-danger' : (product.stock_actual <= (stockThreshold / 2) ? 'table-warning' : '')}>
                    <td>{product.referencia_producto}</td>
                    <td>{product.nombre}</td>
                    <td>{formatQuantity(product.stock_actual)}</td>
                    <td>{product.categoria}</td>
                    <td>{product.proveedor}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default StockReports;