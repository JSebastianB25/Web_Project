// src/components/ProductReports.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, Table, Alert, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:8000/api';

// Función de ayuda para formatear números con puntos de miles (para cantidades si aplica)
const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0, // Las cantidades pueden no tener decimales
    maximumFractionDigits: 0,
  }).format(value);
};

const ProductReports = () => {
  const [mostSoldProducts, setMostSoldProducts] = useState([]);
  const [loadingMostSold, setLoadingMostSold] = useState(true);
  const [errorMostSold, setErrorMostSold] = useState(null);

  const fetchMostSoldProducts = useCallback(async () => {
    setLoadingMostSold(true);
    setErrorMostSold(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/reportes/productos-mas-vendidos/`);
      setMostSoldProducts(response.data);
    } catch (err) {
      console.error('Error fetching most sold products:', err);
      setErrorMostSold('No se pudieron cargar los productos más vendidos.');
      Swal.fire('Error', 'No se pudieron cargar los productos más vendidos. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setLoadingMostSold(false);
    }
  }, []);

  useEffect(() => {
    fetchMostSoldProducts();
  }, [fetchMostSoldProducts]);

  const mostSoldProductsChartData = useMemo(() => {
    const topProducts = mostSoldProducts.slice(0, 10);
    return {
      labels: topProducts.map(p => p.nombre_producto),
      datasets: [
        {
          label: 'Cantidad Vendida',
          data: topProducts.map(p => p.cantidad_total_vendida),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [mostSoldProducts]);

  const mostSoldProductsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 Productos Más Vendidos por Cantidad',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumber(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad',
        },
        ticks: {
            callback: function(value) {
                return formatNumber(value);
            }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Producto',
        },
      },
    },
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">Reportes de Productos</h4>
        <p className="mb-0 text-white-50">Visualiza los productos con mayor volumen de ventas.</p>
      </Card.Header>
      <Card.Body>
        {loadingMostSold ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-2" />
            <p>Cargando productos más vendidos...</p>
          </div>
        ) : errorMostSold ? (
          <Alert variant="danger" className="text-center">
            {errorMostSold}
          </Alert>
        ) : mostSoldProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            No hay datos de productos vendidos aún.
          </Alert>
        ) : (
          <>
            <div className="chart-container mb-4" style={{ height: '350px' }}>
              <Bar data={mostSoldProductsChartData} options={mostSoldProductsChartOptions} />
            </div>
            <h5 className="mt-4">Tabla de Productos Más Vendidos</h5>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Referencia Producto</th>
                    <th>Nombre del Producto</th>
                    <th>Cantidad Total Vendida</th>
                  </tr>
                </thead>
                <tbody>
                  {mostSoldProducts.map((product, index) => (
                    <tr key={product.referencia_producto || index}>
                      <td>{index + 1}</td>
                      <td>{product.referencia_producto}</td>
                      <td>{product.nombre_producto}</td>
                      <td>{new Intl.NumberFormat('es-CO').format(product.cantidad_total_vendida)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductReports;