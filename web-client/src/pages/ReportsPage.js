// web-client/src/pages/ReportsPage.js
import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
// Importa FontAwesomeIcon para el título
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons'; // Icono general para reportes

import ProductReports from '../components/ProductReports';
import ProfitReports from '../components/ProfitReports';
import StockReports from '../components/StockReports';
import EmployeePerformanceReports from '../components/EmployeePerformanceReports';
import CustomerSalesReports from '../components/CustomerSalesReports';

// Importa tus estilos personalizados para esta página
import '../styles/Reports.css'; // Renombrado a ReportsPage.css

const AnimatedReportContent = ({ children, isVisible }) => (
  <div
    style={{
      opacity: isVisible ? 1 : 0,
      maxHeight: isVisible ? '5000px' : '0',
      overflow: 'hidden',
      transition: 'opacity 0.5s ease-in-out, max-height 0.7s ease-in-out',
    }}
  >
    {children}
  </div>
);

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState(null); // Ningún reporte activo por defecto

  return (
    <Container
        fluid
        className="reports-page p-4" // Añadido p-4 para padding general
        style={{
            minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
            backgroundColor: '#ffffff', // Fondo blanco para toda la página
            color: '#000000' // Texto negro por defecto
        }}
    >
      <h2
        className="mb-4 text-center"
        style={{ color: '#000000', fontWeight: 'bold' }} // Título principal en negro
      >
        <FontAwesomeIcon icon={faChartBar} className="me-3" /> Dashboard de Reportes
      </h2>

      <Card
        className="reports-selection-card mb-4" // Clase específica para esta Card
        style={{
            backgroundColor: '#ffffff', // Fondo blanco para la tarjeta
            borderColor: '#e0e0e0', // Borde gris suave
            color: '#000000' // Texto negro por defecto en la tarjeta
        }}
      >
        <Card.Body>
          <h4 className="mb-4 text-center" style={{ color: '#000000' }}>Selecciona un tipo de reporte:</h4>
          <Row className="justify-content-center g-3">
            {/* Botón: Reportes de Ganancias */}
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                className={`py-3 shadow-sm rounded-pill ${activeReport === 'profit' ? 'btn-report-solid-profit' : 'btn-report-outline-profit'}`}
                size="lg"
                onClick={() => setActiveReport('profit')}
              >
                <i className="bi bi-graph-up me-2"></i> Reportes de Ganancias
              </Button>
            </Col>
            {/* Botón: Reportes de Productos */}
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                className={`py-3 shadow-sm rounded-pill ${activeReport === 'products' ? 'btn-report-solid-products' : 'btn-report-outline-products'}`}
                size="lg"
                onClick={() => setActiveReport('products')}
              >
                <i className="bi bi-box-seam me-2"></i> Reportes de Productos
              </Button>
            </Col>
            {/* Botón: Stock Crítico */}
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                className={`py-3 shadow-sm rounded-pill ${activeReport === 'stock' ? 'btn-report-solid-stock' : 'btn-report-outline-stock'}`}
                size="lg"
                onClick={() => setActiveReport('stock')}
              >
                <i className="bi bi-exclamation-triangle me-2"></i> Stock Crítico
              </Button>
            </Col>
            {/* Botón: Rendimiento Empleados */}
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                className={`py-3 shadow-sm rounded-pill ${activeReport === 'employees' ? 'btn-report-solid-employees' : 'btn-report-outline-employees'}`}
                size="lg"
                onClick={() => setActiveReport('employees')}
              >
                <i className="bi bi-person-fill-gear me-2"></i> Rendimiento Empleados
              </Button>
            </Col>
            {/* Botón: Ventas por Cliente */}
            <Col xs={12} sm={6} md={4} lg={3} className="d-grid">
              <Button
                className={`py-3 shadow-sm rounded-pill ${activeReport === 'customers' ? 'btn-report-solid-customers' : 'btn-report-outline-customers'}`}
                size="lg"
                onClick={() => setActiveReport('customers')}
              >
                <i className="bi bi-person-heart me-2"></i> Ventas por Cliente
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contenido del reporte seleccionado con animación (sin cambios funcionales) */}
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
                <Alert
                    variant="dark"
                    className="text-center mt-4 reports-alert" // Clase para estilos específicos
                    style={{
                        backgroundColor: '#f8f9fa', // Fondo de alerta blanco muy suave
                        borderColor: '#00b45c', // Borde de alerta verde
                        color: '#000000' // Texto de alerta negro
                    }}
                >
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