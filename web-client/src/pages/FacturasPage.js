// src/pages/FacturasPage.js
import React, { useState, useEffect } from 'react';

// Si usas un archivo CSS global (ej. App.css), asegúrate de que las clases usadas aquí estén definidas allí.
// Si prefieres un CSS específico para esta página, crea FacturasPage.css e impórtalo:
// import './FacturasPage.css';

const FacturasPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' }); // Para mensajes de éxito/error de acciones

  // Estados para estadísticas resumen
  const [totalFacturas, setTotalFacturas] = useState(0);
  const [totalVentasGlobal, setTotalVentasGlobal] = useState(0);

  // Estados para el modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFacturaDetails, setSelectedFacturaDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);


  useEffect(() => {
    fetchFacturas();
  }, []);

  // Función para obtener la lista de facturas
  const fetchFacturas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8000/api/facturas/');
      if (!response.ok) {
        throw new Error(`Error al cargar facturas: ${response.statusText}`);
      }
      const data = await response.json();
      setFacturas(data);

      const sumTotal = data.reduce((sum, factura) => sum + parseFloat(factura.total), 0);
      setTotalFacturas(data.length);
      setTotalVentasGlobal(sumTotal);

    } catch (err) {
      console.error("Error al obtener las facturas:", err);
      setError({ message: "No se pudieron cargar las facturas. Intenta de nuevo más tarde." });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener los detalles de una factura específica
  const handleViewDetails = async (facturaId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedFacturaDetails(null); // Limpiar detalles anteriores
    setShowDetailsModal(true); // Abrir el modal inmediatamente, mostrando estado de carga

    try {
      const response = await fetch(`http://localhost:8000/api/facturas/${facturaId}/`);
      if (!response.ok) {
        throw new Error(`Error al cargar detalles de factura: ${response.statusText}`);
      }
      const data = await response.json();
      setSelectedFacturaDetails(data);
    } catch (err) {
      console.error("Error al obtener detalles de factura:", err);
      setDetailsError({ message: "No se pudieron cargar los detalles de la factura." });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedFacturaDetails(null);
    setDetailsError(null); // Limpiar errores al cerrar
  };

  // Función para eliminar una factura
  const handleDeleteFactura = async (facturaId) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la factura #${facturaId}?
    ¡ADVERTENCIA!: Esta acción debería revertir el stock de los productos asociados en el sistema. Asegúrate de que el backend maneje esta lógica.`)) {
      return;
    }

    try {
      setActionMessage({ type: 'info', text: 'Eliminando factura...' });
      const response = await fetch(`http://localhost:8000/api/facturas/${facturaId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 204) {
        setActionMessage({ type: 'success', text: `Factura #${facturaId} eliminada exitosamente.` });
        fetchFacturas();
      } else if (response.status === 404) {
         throw new Error(`Factura #${facturaId} no encontrada.`);
      } else {
        const errorData = await response.json();
        throw new Error(`Error al eliminar factura: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error("Error al eliminar factura:", err);
      setActionMessage({ type: 'error', text: err.message || "Ocurrió un error desconocido al eliminar la factura." });
    }
  };

  // Renderizado condicional para estados de carga y error (de la lista principal)
  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-message">
          <span role="img" aria-label="loading">⏳</span> Cargando facturas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-message">
          <span role="img" aria-label="error">❌</span> {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content factura-page-container">
      <div className="header-container">
        <h2 className="page-heading">🧾 Visor y Gestión de Facturas</h2>
      </div>

      {/* Mensajes de acciones (eliminar) */}
      {actionMessage.text && (
        <div className={`alert-message ${actionMessage.type}-message`}>
          <span role="img" aria-label="icon">
            {actionMessage.type === 'success' ? '✅' : actionMessage.type === 'error' ? '❌' : 'ℹ️'}
          </span> {actionMessage.text}
        </div>
      )}

      {/* Sección de Resumen Gráfico (Estadísticas Clave) */}
      <div className="summary-cards-container">
        <div className="summary-card">
          <h3>Total de Facturas</h3>
          <p className="summary-value">{totalFacturas}</p>
        </div>
        <div className="summary-card">
          <h3>Total de Ventas Global</h3>
          <p className="summary-value">${totalVentasGlobal.toFixed(2)}</p>
        </div>
      </div>

      {/* Listado de Facturas en tabla */}
      {facturas.length === 0 ? (
        <p className="empty-state">No hay facturas registradas.</p>
      ) : (
        <div className="table-container">
          <h3>Detalle de Facturas</h3>
          <table>
            <thead>
              <tr>
                <th>ID Factura</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Forma de Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((factura) => (
                <tr key={factura.id}>
                  <td>{factura.id}</td>
                  <td>{new Date(factura.fecha).toLocaleDateString()}</td>
                  {/* Aquí usamos cliente_nombre que esperamos del serializer anidado */}
                  <td>{factura.cliente_nombre || `ID: ${factura.cliente}`}</td>
                  {/* Aquí usamos forma_pago_nombre que esperamos del serializer anidado */}
                  <td>{factura.forma_pago_nombre || `ID: ${factura.forma_pago}`}</td>
                  <td>${parseFloat(factura.total).toFixed(2)}</td>
                  <td>{factura.estado}</td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => handleViewDetails(factura.id)}
                    >
                      Ver Detalles
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteFactura(factura.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalles de Factura */}
      {showDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detalles de Factura #{selectedFacturaDetails ? selectedFacturaDetails.id : ''}</h3>
              <button className="close-button" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="modal-body">
              {detailsLoading && <div className="loading-message">Cargando detalles...</div>}
              {detailsError && <div className="error-message">{detailsError.message}</div>}

              {selectedFacturaDetails && (
                <div className="invoice-details-grid">
                  <div className="detail-item">
                    <strong>Fecha:</strong> {new Date(selectedFacturaDetails.fecha).toLocaleDateString()}
                  </div>
                  <div className="detail-item">
                    <strong>Cliente:</strong> {selectedFacturaDetails.cliente_nombre || `ID: ${selectedFacturaDetails.cliente}`}
                  </div>
                  <div className="detail-item">
                    <strong>Forma de Pago:</strong> {selectedFacturaDetails.forma_pago_nombre || `ID: ${selectedFacturaDetails.forma_pago}`}
                  </div>
                  <div className="detail-item">
                    <strong>Usuario:</strong> {selectedFacturaDetails.usuario_nombre || `ID: ${selectedFacturaDetails.usuario}`}
                  </div>
                  <div className="detail-item">
                    <strong>Estado:</strong> {selectedFacturaDetails.estado}
                  </div>
                  <div className="detail-item total-amount">
                    <strong>Total Factura:</strong> ${parseFloat(selectedFacturaDetails.total).toFixed(2)}
                  </div>

                  <h4>Productos de la Venta:</h4>
                  {selectedFacturaDetails.detalle_ventas && selectedFacturaDetails.detalle_ventas.length > 0 ? (
                    <div className="products-list-container">
                      {selectedFacturaDetails.detalle_ventas.map((detalle) => (
                        <div key={detalle.id} className="product-detail-card">
                          {detalle.producto && (
                            <>
                              <div className="product-image-wrapper">
                                {/* Asegúrate que detalle.producto.imagen_url exista y sea válido */}
                                {detalle.producto.imagen_url ? (
                                  <img src={detalle.producto.imagen_url} alt={detalle.producto.nombre_producto} className="product-thumb" />
                                ) : (
                                  <div className="no-image-placeholder">No Image</div>
                                )}
                              </div>
                              <div className="product-info">
                                <strong>{detalle.producto.nombre_producto}</strong>
                                <p>Cantidad: {detalle.cantidad}</p>
                                <p>Precio Unitario: ${parseFloat(detalle.precio_unitario_venta).toFixed(2)}</p>
                                <p>Subtotal: ${parseFloat(detalle.subtotal).toFixed(2)}</p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No hay productos registrados para esta venta.</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-button" onClick={closeDetailsModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturasPage;