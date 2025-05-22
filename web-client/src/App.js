import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css"; // Tus estilos globales
import Navbar from "./Navbar"; // Tu barra de navegación

// Importa todos los componentes de página que creaste
import InicioPage from './pages/InicioPage';
import AgregarProductoPage from './pages/AgregarProductoPage';
import EditarProductosPage from './pages/EditarProductosPage';
import EliminarProductosPage from './pages/EliminarProductosPage';
import RolesPage from './pages/RolesPage';
import PermisosPage from './pages/PermisosPage';
import UsuariosPage from './pages/UsuariosPage';
import FacturasPage from './pages/FacturasPage';
import DetalleVentaPage from './pages/DetalleVentaPage';
import ClientesPage from './pages/ClientesPage';
import FormasPagoPage from './pages/FormasPagoPage';
import CategoriasPage from './pages/CategoriasPage';
import POSPage from './pages/POSPage';
import ProveedoresPage from './pages/ProveedoresPage';

const App = () => {
  return (
    <Router> {/* Envuelve toda tu aplicación con el Router */}
      <div className="app-container">
        <Navbar /> {/* El Navbar estará presente en todas las páginas */}
        <main className="main-content"> {/* Contenedor para el contenido de la página */}
          <Routes> {/* Define tus rutas aquí */}
            <Route path="/" element={<InicioPage />} />
            
            {/* Rutas de Productos */}
            <Route path="/crear-productos" element={<AgregarProductoPage />} />
            <Route path="/editar-productos" element={<EditarProductosPage />} />
            <Route path="/eliminar-productos" element={<EliminarProductosPage />} />

            {/* Rutas de Gestionar Accesos */}
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permisos" element={<PermisosPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />

            {/* Rutas de Ventas */}
            <Route path="/pos" element={<POSPage />} />
            <Route path="/facturas" element={<FacturasPage />} />
            <Route path="/detalles-venta" element={<DetalleVentaPage />} />

            {/* Rutas de Administrar */}
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/formas-pago" element={<FormasPagoPage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            
            {/* Ruta para páginas no encontradas (404) */}
            <Route path="*" element={
              <div className="page-content"> {/* Puedes usar tu clase .page-content o crear una específica */}
                <h2>Página no encontrada (404)</h2>
                <p>La página que buscas no existe.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;