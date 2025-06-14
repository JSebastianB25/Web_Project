// src/components/ProfitReports.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, Table, Alert, Spinner, Button, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
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

// Función de ayuda para formatear números con puntos de miles y decimales para dinero
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', { // Ajusta 'es-CO' a tu configuración regional si es necesario
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Función de ayuda para formatear números enteros (cantidades)
const formatQuantity = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO').format(value);
};

const ProfitReports = () => {
  // --- Estados para Ganancias por Rango de Fechas (Resumen) ---
  const [totalGrossSales, setTotalGrossSales] = useState(0); // Renombrado de totalProfit para mayor claridad
  const [numberOfSales, setNumberOfSales] = useState(0);
  const [profitSummaryStartDate, setProfitSummaryStartDate] = useState(null);
  const [profitSummaryEndDate, setProfitSummaryEndDate] = useState(new Date());
  const [loadingProfitSummary, setLoadingProfitSummary] = useState(false);
  const [errorProfitSummary, setErrorProfitSummary] = useState(null);

  // --- Estados para Ingresos/Ganancias Detallados ---
  const [detailedIncomes, setDetailedIncomes] = useState([]);
  const [loadingDetailedIncomes, setLoadingDetailedIncomes] = useState(false);
  const [errorDetailedIncomes, setErrorDetailedIncomes] = useState(null);
  const [detailedStartDate, setDetailedStartDate] = useState(null);
  const [detailedEndDate, setDetailedEndDate] = useState(new Date());

  // Fetches Profits by Date Range (Summary)
  const fetchProfitSummary = useCallback(async () => {
    setLoadingProfitSummary(true);
    setErrorProfitSummary(null);
    try {
      const params = new URLSearchParams();
      if (profitSummaryStartDate) {
        params.append('start_date', format(profitSummaryStartDate, 'yyyy-MM-dd'));
      }
      if (profitSummaryEndDate) {
        params.append('end_date', format(profitSummaryEndDate, 'yyyy-MM-dd'));
      }

      const url = `${API_BASE_URL}/reportes/ganancias-por-fecha/?${params.toString()}`;
      console.log("Fetching Profit Summary URL:", url);
      const response = await axios.get(url);
      setTotalGrossSales(response.data.ganancia_bruta_total); // Esto sigue siendo el ingreso bruto total
      setNumberOfSales(response.data.numero_facturas);
    } catch (err) {
      console.error('Error fetching profit summary:', err);
      setErrorProfitSummary('No se pudieron cargar las ganancias para el rango de fechas seleccionado.');
      Swal.fire('Error', 'No se pudieron cargar las ganancias. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setLoadingProfitSummary(false);
    }
  }, [profitSummaryStartDate, profitSummaryEndDate]);

  // Fetches Detailed Incomes/Profits
  const fetchDetailedIncomes = useCallback(async () => {
    setLoadingDetailedIncomes(true);
    setErrorDetailedIncomes(null);
    try {
      const params = new URLSearchParams();
      if (detailedStartDate) {
        params.append('start_date', format(detailedStartDate, 'yyyy-MM-dd'));
      }
      if (detailedEndDate) {
        params.append('end_date', format(detailedEndDate, 'yyyy-MM-dd'));
      }

      const url = `${API_BASE_URL}/reportes/ingresos-detallados/?${params.toString()}`;
      console.log("Fetching Detailed Incomes URL:", url);
      const response = await axios.get(url);
      setDetailedIncomes(response.data);
    } catch (err) {
      console.error('Error fetching detailed incomes:', err);
      setErrorDetailedIncomes('No se pudieron cargar los ingresos detallados.');
      Swal.fire('Error', 'No se pudieron cargar los ingresos detallados. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setLoadingDetailedIncomes(false);
    }
  }, [detailedStartDate, detailedEndDate]);

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setProfitSummaryStartDate(thirtyDaysAgo);
    setProfitSummaryEndDate(today);
    setDetailedStartDate(thirtyDaysAgo);
    setDetailedEndDate(today);
  }, []); // Solo al montar el componente

  useEffect(() => {
    fetchProfitSummary();
  }, [fetchProfitSummary]);

  useEffect(() => {
    fetchDetailedIncomes();
  }, [fetchDetailedIncomes]);

  // Gráfico: Ganancias Brutas Diarias
  const dailyProfitsChartData = useMemo(() => {
    const dailyTotals = {};
    detailedIncomes.forEach(item => {
      const date = format(parseISO(item.fecha_factura), 'yyyy-MM-dd');
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += parseFloat(item.ganancia_por_item || 0);
    });

    const labels = Object.keys(dailyTotals).sort();
    const data = labels.map(date => dailyTotals[date]);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Ganancia Bruta Diaria ($)',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [detailedIncomes]);

  const dailyProfitsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ganancias Brutas Diarias por Período',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `$ ${formatCurrency(context.parsed.y)}`;
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
          text: 'Ganancia ($)',
        },
        ticks: {
            callback: function(value) {
                return `$ ${formatCurrency(value)}`;
            }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Fecha',
        },
      },
    },
  };

  // Calcular la Ganancia Neta Total del período detallado
  const totalNetProfit = useMemo(() => {
    return detailedIncomes.reduce((sum, item) => sum + parseFloat(item.ganancia_por_item || 0), 0);
  }, [detailedIncomes]);

  return (
    <>
      {/* --- Reporte: Ganancias por Rango de Fechas (Resumen) --- */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h4 className="mb-0">Reporte Resumen de Ganancias</h4>
          <p className="mb-0 text-white-50">Consulta los ingresos brutos y el número de ventas en un período.</p>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-end mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Fecha Desde:</Form.Label>
                <DatePicker
                  selected={profitSummaryStartDate}
                  onChange={(date) => setProfitSummaryStartDate(date)}
                  selectsStart
                  startDate={profitSummaryStartDate}
                  endDate={profitSummaryEndDate}
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
                  selected={profitSummaryEndDate}
                  onChange={(date) => setProfitSummaryEndDate(date)}
                  selectsEnd
                  startDate={profitSummaryStartDate}
                  endDate={profitSummaryEndDate}
                  minDate={profitSummaryStartDate}
                  placeholderText="Fecha fin"
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex justify-content-end align-items-end">
              <Button variant="success" onClick={fetchProfitSummary} disabled={loadingProfitSummary}>
                {loadingProfitSummary ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Consultar Resumen'}
              </Button>
            </Col>
          </Row>

          {loadingProfitSummary ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" className="mb-2" />
              <p>Calculando ganancias...</p>
            </div>
          ) : errorProfitSummary ? (
            <Alert variant="danger" className="text-center">
              {errorProfitSummary}
            </Alert>
          ) : (
            <div className="mt-4 text-center">
              <Row>
                <Col md={6}>
                  <Card className="bg-light mb-2">
                    <Card.Body>
                      <h4 className="mb-0">Total de Ventas Brutas:</h4>
                      <h3 className="text-success">$ {formatCurrency(totalGrossSales)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light mb-2">
                    <Card.Body>
                      <h4 className="mb-0">Número de Facturas:</h4>
                      <h3 className="text-info">{formatQuantity(numberOfSales)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Alert variant="info" className="mt-3">
                Para un detalle de la ganancia por producto y la evolución diaria, usa la sección inferior.
              </Alert>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* --- Reporte: Detalle de Ganancias por Producto y Fecha con Gráfico --- */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-info text-white">
          <h4 className="mb-0">Reporte Detallado de Ganancias</h4>
          <p className="mb-0 text-white-50">Explora la rentabilidad a nivel de producto y su evolución diaria.</p>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-end mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Fecha Desde:</Form.Label>
                <DatePicker
                  selected={detailedStartDate}
                  onChange={(date) => setDetailedStartDate(date)}
                  selectsStart
                  startDate={detailedStartDate}
                  endDate={detailedEndDate}
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
                  selected={detailedEndDate}
                  onChange={(date) => setDetailedEndDate(date)}
                  selectsEnd
                  startDate={detailedStartDate}
                  endDate={detailedEndDate}
                  minDate={detailedStartDate}
                  placeholderText="Fecha fin"
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex justify-content-end align-items-end">
              <Button variant="info" onClick={fetchDetailedIncomes} disabled={loadingDetailedIncomes}>
                {loadingDetailedIncomes ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Consultar Detalle'}
              </Button>
            </Col>
          </Row>

          {loadingDetailedIncomes ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" className="mb-2" />
              <p>Cargando detalles de ingresos...</p>
            </div>
          ) : errorDetailedIncomes ? (
            <Alert variant="danger" className="text-center">
              {errorDetailedIncomes}
            </Alert>
          ) : detailedIncomes.length === 0 ? (
            <Alert variant="info" className="text-center">
              No hay datos de ingresos detallados para este período.
            </Alert>
          ) : (
            <>
              {/* Suma de Ganancias Netas Totales */}
              <div className="text-center mb-4">
                <Card className="bg-light p-3">
                  <h4 className="mb-0">Ganancia Neta Total del Período:</h4>
                  <h2 className="text-success">$ {formatCurrency(totalNetProfit)}</h2>
                </Card>
              </div>

              <h5 className="mb-3">Ganancias Brutas Diarias</h5>
              <div className="chart-container mb-4" style={{ height: '350px' }}>
                <Bar data={dailyProfitsChartData} options={dailyProfitsChartOptions} />
              </div>
              <h5 className="mt-4">Tabla de Detalle por Producto y Factura</h5>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Factura ID</th>
                      <th>Cliente</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>P. Venta U.</th>
                      <th>P. Costo U.</th>
                      <th>Ganancia U.</th>
                      <th>Ganancia Total</th>
                    </tr>
                  </thead>
                  <tbody>
                        {detailedIncomes.map((item) => (
                          <tr key={item.id_detalle_venta}>
                            <td>{format(parseISO(item.fecha_factura), 'dd/MM/yyyy HH:mm')}</td>
                            <td>{item.factura_id}</td>
                            <td>{item.nombre_cliente}</td>
                            <td>{item.nombre_producto} ({item.referencia_producto})</td>
                            <td>{formatQuantity(item.cantidad)}</td>
                            <td>$ {formatCurrency(parseFloat(item.precio_unitario_venta))}</td>
                            <td>$ {formatCurrency(parseFloat(item.costo_unitario_producto || 0))}</td>
                            <td>$ {formatCurrency(parseFloat(item.precio_unitario_venta) - parseFloat(item.costo_unitario_producto || 0))}</td>
                            <td>$ {formatCurrency(parseFloat(item.ganancia_por_item))}</td>
                          </tr>
                        ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default ProfitReports;