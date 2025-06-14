// web-client/src/pages/ReportsPage.js
import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap'; // Asegúrate que Alert esté importado
import ProductReports from '../components/ProductReports';
import ProfitReports from '../components/ProfitReports';
import StockReports from '../components/StockReports';
import EmployeePerformanceReports from '../components/EmployeePerformanceReports';
import CustomerSalesReports from '../components/CustomerSalesReports';


// Pequeño componente para la animación de fade-in
const AnimatedReportContent = ({ children, isVisible }) => (
  <div
    style={{
      opacity: isVisible ? 1 : 0,
      maxHeight: isVisible ? '5000px' : '0', // Un valor grande para la altura máxima para animar el contenido
      overflow: 'hidden',
      transition: 'opacity 0.5s ease-in-out, max-height 0.7s ease-in-out',
    }}
  >
    {children}
  </div>
);

const ReportsPage = () => {
  // Estado para controlar qué reporte está activo (null, 'profit', 'products', 'stock')
  const [activeReport, setActiveReport] = useState(null); // Ningún reporte activo por defecto

  return (
    <Container fluid className="reports-page p-3">
      <h2 className="mb-4 text-center">Dashboard de Reportes</h2>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-4 text-center">Selecciona un Tipo de Reporte:</h4>
          <Row className="justify-content-center g-3">
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                variant={activeReport === 'profit' ? 'primary' : 'outline-primary'}
                size="lg"
                onClick={() => setActiveReport('profit')}
                className="py-3 shadow-sm rounded-pill"
              >
                <i className="bi bi-graph-up me-2"></i> Reportes de Ganancias
              </Button>
            </Col>
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                variant={activeReport === 'products' ? 'success' : 'outline-success'}
                size="lg"
                onClick={() => setActiveReport('products')}
                className="py-3 shadow-sm rounded-pill"
              >
                <i className="bi bi-box-seam me-2"></i> Reportes de Productos
              </Button>
            </Col>
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                variant={activeReport === 'stock' ? 'warning' : 'outline-warning'}
                size="lg"
                onClick={() => setActiveReport('stock')}
                className="py-3 shadow-sm rounded-pill"
              >
                <i className="bi bi-exclamation-triangle me-2"></i> Stock Crítico
              </Button>
            </Col>
          {/* --- NUEVO BOTÓN PARA RENDIMIENTO DE EMPLEADOS --- */}
          <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
            <Button
              variant={activeReport === 'employees' ? 'info' : 'outline-info'}
              size="lg"
              onClick={() => setActiveReport('employees')}
              className="py-3 shadow-sm rounded-pill"
            >
              <i className="bi bi-person-fill-gear me-2"></i> Rendimiento Empleados
            </Button>
          </Col>
          {/* --- NUEVO BOTÓN PARA VENTAS POR CLIENTE --- */}
          <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
            <Button
              variant={activeReport === 'customers' ? 'primary' : 'outline-primary'}
              size="lg"
              onClick={() => setActiveReport('customers')}
              className="py-3 shadow-sm rounded-pill"
            >
              <i className="bi bi-person-heart me-2"></i> Ventas por Cliente
            </Button>
          </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contenido del reporte seleccionado con animación */}
      <AnimatedReportContent isVisible={activeReport !== null}>
        {(() => {
          switch (activeReport) {
            case 'profit':
              return <ProfitReports />;
            case 'products':
              return <ProductReports />;
            case 'stock':
              return <StockReports />;
              case 'employees':
            return <EmployeePerformanceReports />;
              case 'customers':
            return <CustomerSalesReports />;
          default:
              return (
                <Alert variant="info" className="text-center mt-4">
                  Selecciona un tipo de reporte para visualizar los datos.
                </Alert>
              );
          }
        })()}
      </AnimatedReportContent>
    </Container>
  );
};

export default ReportsPage;