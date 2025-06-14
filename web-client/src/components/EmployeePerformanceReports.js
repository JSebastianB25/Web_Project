// src/components/EmployeePerformanceReports.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, Table, Alert, Spinner, Form, Row, Col, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
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

// Función de ayuda para formatear moneda
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP', // Ajusta tu moneda
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Función de ayuda para formatear números enteros
const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO').format(value);
};

const EmployeePerformanceReports = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        params.append('end_date', format(endDate, 'yyyy-MM-dd'));
      }

      const response = await axios.get(`${API_BASE_URL}/reportes/rendimiento-empleados/?${params.toString()}`);
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Error fetching employee performance data:', err);
      setError('No se pudieron cargar los datos de rendimiento de empleados.');
      Swal.fire('Error', 'No se pudieron cargar los datos de rendimiento de empleados. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // Establecer un rango de fechas por defecto al cargar, ej., últimos 30 días
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
  }, []);

  useEffect(() => {
    // Cuando las fechas por defecto se establezcan, o cambien, se hace la llamada inicial
    if (startDate && endDate) {
      fetchPerformanceData();
    }
  }, [startDate, endDate, fetchPerformanceData]);

  // Aquí no hay cambios en el input, ya que el problema era en el backend al borrar el valor
  // Las fechas se manejan con DatePicker

  const chartData = useMemo(() => {
    const sortedData = [...performanceData].sort((a, b) => b.total_ventas_netas - a.total_ventas_netas);
    const topPerformers = sortedData.slice(0, 10); // Mostrar top 10 en el gráfico

    return {
      labels: topPerformers.map(item => item.nombre_empleado), // <--- ESTO YA ESTABA BIEN
      datasets: [
        {
          label: 'Total de Ventas Netas',
          data: topPerformers.map(item => item.total_ventas_netas),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [performanceData]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 Empleados por Ventas Netas',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
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
          text: 'Ventas Netas',
        },
        ticks: {
            callback: function(value) {
                return formatCurrency(value);
            }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Empleado',
        },
      },
    },
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-info text-white">
        <h4 className="mb-0">Reporte de Rendimiento de Empleados</h4>
        <p className="mb-0 text-white-50">Analiza el desempeño de ventas de tus empleados.</p>
      </Card.Header>
      <Card.Body>
        <Row className="align-items-end mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Fecha Desde:</Form.Label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Fecha inicio"
                className="form-control"
                dateFormat="dd/MM/yyyy"
                isClearable
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Fecha Hasta:</Form.Label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="Fecha fin"
                className="form-control"
                dateFormat="dd/MM/yyyy"
                isClearable
              />
            </Form.Group>
          </Col>
          <Col md={4} className="d-flex justify-content-end align-items-end">
            <Button variant="info" onClick={fetchPerformanceData} disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Consultar'}
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-2" />
            <p>Cargando datos de rendimiento...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : performanceData.length === 0 ? (
          <Alert variant="info" className="text-center">
            No hay datos de rendimiento de empleados para el período seleccionado.
          </Alert>
        ) : (
          <>
            <div className="chart-container mb-4" style={{ height: '350px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
            <h5 className="mt-4">Tabla de Rendimiento de Empleados</h5>
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Empleado</th>
                    <th>Total Ventas Netas</th>
                    <th>Número de Facturas</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((item, index) => (
                    <tr key={item.empleado_id || `unassigned-${index}`}>
                      <td>{index + 1}</td>
                      <td>{item.nombre_empleado}</td> {/* <--- ESTO YA ESTABA BIEN, si el backend lo envía así */}
                      <td>{formatCurrency(item.total_ventas_netas)}</td>
                      <td>{formatNumber(item.numero_facturas)}</td>
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

export default EmployeePerformanceReports;