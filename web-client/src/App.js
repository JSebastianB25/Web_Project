// web-client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

function App() {
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/productos/agregar" element={<AgregarProductoPage />} />
        <Route path="/marcas" element={<MarcaPage />} />
        <Route path="/proveedores" element={<ProveedorPage />} />
        <Route path="/categorias" element={<CategoriaPage />} />
        <Route path="/formas-pago" element={<FormaPagoPage />} />
        <Route path="/clientes" element={<ClientePage />} />
        <Route path="/editar/eliminarclientes" element={<EditarEliminarProductosPage />} />
        <Route path="/ver/productos" element={<ProductosPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/permisos" element={<PermisosPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        
        {/* Agrega otras rutas aquí */}
      </Routes>
    </Router>
  );
}

export default App;