// web-client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- IMPORTS DEL SISTEMA DE AUTENTICACIÓN ---
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import 'animate.css/animate.min.css';
// --- FIN IMPORTS AUTENTICACIÓN ---

// Importa los componentes de tu aplicación
import Navbar from './Navbar';
import InicioPage from './pages/InicioPage';
import AgregarProductoPage from './pages/AgregarProductoPage';
import MarcaPage from './pages/MarcasPage';
import ProveedorPage from './pages/ProveedoresPage';
import CategoriaPage from './pages/CategoriasPage';
import FormaPagoPage from './pages/FormasPagoPage';
import ClientePage from './pages/ClientesPage';
import EditarEliminarProductosPage from './pages/EditarEliminarProductosPage';
import ProductosPage from './pages/ProductosPage';
import RolesPage from './pages/RolesPage';
import PermisosPage from './pages/PermisosPage';
import UsuariosPage from './pages/UsuariosPage';
import POSPage from './pages/POSPage';
import FacturasPage from './pages/FacturasPage';
import ReportesPage from './pages/ReportsPage';

// Importa los estilos de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        
        <Routes>
          {/* Ruta de Login - Accesible para todos */}
          <Route path="/login" element={<LoginPage />} />

          {/* Ruta de Acceso Denegado - Se redirige aquí cuando un usuario no tiene permisos */}
          <Route path="/acceso-denegado" element={
            <div className="container mt-5">
              <div className="alert alert-danger" role="alert">
                <h3>Acceso Denegado</h3>
                <p>No tienes los permisos necesarios para acceder a esta sección.</p>
                <p>Si crees que esto es un error, por favor contacta al administrador del sistema.</p>
                <a href="/">Volver al Inicio</a>
              </div>
            </div>
          } />

          {/* Todas las rutas que quieres PROTEGER por autenticación Y por permisos.
              La <Route element={<PrivateRoute />}> de nivel superior solo verifica autenticación.
              Las <Route element={<PrivateRoute requiredPermissions={['...']} />} /> internas
              verifican autenticación Y los permisos específicos.
          */}
          <Route element={<PrivateRoute />}>
            {/* Ruta de Inicio protegida (solo autenticación) */}
            <Route path="/" element={<InicioPage />} /> 

            {/* Gestión de Roles */}
            <Route 
                path="/roles" 
                element={<PrivateRoute requiredPermissions={['Acceso total']} />} 
            >
                <Route index element={<RolesPage />} />
            </Route>

            {/* Gestión de Usuarios */}
            <Route 
                path="/usuarios" 
                element={<PrivateRoute requiredPermissions={['Acceso total']} />} 
            >
                <Route index element={<UsuariosPage />} />
            </Route>

            {/* Gestión de Permisos */}
            <Route 
                path="/permisos" 
                element={<PrivateRoute requiredPermissions={['Acceso total']} />} 
            >
                <Route index element={<PermisosPage />} />
            </Route>
            
            {/* Agregar Producto */}
            <Route 
                path="/productos/agregar" 
                element={<PrivateRoute requiredPermissions={['Acceso total', 'Acceso administrador']} />} 
            >
                <Route index element={<AgregarProductoPage />} />
            </Route>

            {/* Gestión de Marcas */}
            <Route 
                path="/marcas" 
                element={<PrivateRoute requiredPermissions={['Acceso total', 'Acceso administrador']} />} 
            >
                <Route index element={<MarcaPage />} />
            </Route>

            {/* Gestión de Proveedores */}
            <Route 
                path="/proveedores" 
                element={<PrivateRoute requiredPermissions={['Acceso total', 'Acceso administrador']} />} 
            >
                <Route index element={<ProveedorPage />} />
            </Route>

            {/* Gestión de Categorías */}
            <Route 
                path="/categorias" 
                element={<PrivateRoute requiredPermissions={['Acceso total', 'Acceso administrador']} />} 
            >
                <Route index element={<CategoriaPage />} />
            </Route>

            {/* Gestión de Formas de Pago */}
            <Route 
                path="/formas-pago" 
                element={<PrivateRoute requiredPermissions={['Acceso total', 'Acceso administrador']} />} 
            >
                <Route index element={<FormaPagoPage />} />
            </Route>
            
            {/* Gestión de Clientes */}
            <Route 
                path="/clientes" 
                element={<PrivateRoute requiredPermissions={['Acceso total','Acceso administrador','Acceso vendedor']} />} 
            >
                <Route index element={<ClientePage />} />
            </Route>

            {/* Editar/Eliminar Productos */}
            <Route 
                path="/editar/eliminarclientes" // El nombre de esta ruta es un poco confuso, parece de clientes
                element={<PrivateRoute requiredPermissions={['Acceso total','Acceso administrador']} />} 
            >
                <Route index element={<EditarEliminarProductosPage />} />
            </Route>

            {/* Ver Productos */}
            <Route 
                path="/ver/productos" 
                element={<PrivateRoute requiredPermissions={['Acceso total','Acceso vendedor','Acceso administrador']} />} 
            >
                <Route index element={<ProductosPage />} />
            </Route>
            
            {/* Punto de Venta (POS) */}
            <Route 
                path='/pos' 
                element={<PrivateRoute requiredPermissions={['Acceso total','Acceso vendedor','Acceso administrador']} />} 
            >
                <Route index element={<POSPage />} />
            </Route>
            
            {/* Ver Facturas */}
            <Route 
                path='/facturas' 
                element={<PrivateRoute requiredPermissions={['Acceso total', 'Acceso administrador']} />} 
            >
                <Route index element={<FacturasPage />} />
            </Route>
            
            {/* Ver Reportes */}
            <Route 
                path='/reportes' 
                element={<PrivateRoute requiredPermissions={['Acceso total','Acceso administrador']} />} 
            >
                <Route index element={<ReportesPage />} />
            </Route>

            {/* Agrega aquí cualquier otra ruta que deba estar protegida con permisos */}
            
          </Route> {/* Fin del grupo de Rutas Protegidas por autenticación principal */}

          {/* Ruta 404 - Siempre al final para capturar cualquier ruta no definida */}
          <Route path="*" element={
              <div className="container mt-5">
                  <div className="alert alert-warning" role="alert">
                      <h3>404 - Página No Encontrada</h3>
                      <p>La URL que intentas acceder no existe.</p>
                      <a href="/">Volver al Inicio</a>
                  </div>
              </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;