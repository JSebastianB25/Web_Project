import React from 'react';
import { Navbar as BSNavbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from './context/AuthContext';
import usePermission from './hooks/usePermission'; 

import './Navbar.css'; 

const Navbar = () => {
  const { user, logoutUser } = useAuth();

  // --- Verificaciones de Permisos --- (sin cambios funcionales)
  const canViewReports = usePermission('Acceso total') || usePermission('Acceso administrador');
  const canViewProducts = usePermission('Acceso total') || usePermission('Acceso administrador') || usePermission('Acceso vendedor');
  const canAddProduct = usePermission('Acceso total') || usePermission('Acceso administrador');
  const canEditDeleteProducts = usePermission('Acceso total') || usePermission('Acceso administrador');
  const showProductsDropdown = canViewProducts || canAddProduct || canEditDeleteProducts;
  const canViewProveedores = usePermission('Acceso total') || usePermission('Acceso administrador');
  const canViewMarcas = usePermission('Acceso total') || usePermission('Acceso administrador');
  const canViewCategorias = usePermission('Acceso total') || usePermission('Acceso administrador');
  const canViewFormasPago = usePermission('Acceso total') || usePermission('Acceso administrador');
  const showCreateDatosDropdown = canViewProveedores || canViewMarcas || canViewCategorias || canViewFormasPago;
  const canViewRoles = usePermission('Acceso total');
  const canViewUsuarios = usePermission('Acceso total');
  const canViewPermisos = usePermission('Acceso total');
  const showUserConfigDropdown = canViewRoles || canViewUsuarios || canViewPermisos;
  const canCreateClient = usePermission('Acceso total') || usePermission('Acceso administrador') || usePermission('Acceso vendedor');
  const canGenerateSale = usePermission('Acceso total') || usePermission('Acceso administrador') || usePermission('Acceso vendedor');
  const canViewFacturas = usePermission('Acceso total') || usePermission('Acceso administrador');
  const showVentasDropdown = canCreateClient || canGenerateSale || canViewFacturas;


  return (
    <BSNavbar 
        expand="lg" 
        className="custom-navbar" // Clase personalizada para aplicar estilos desde CSS
    >
      <Container>
        {/* Marca/Logo - CAMBIO AQUÍ: Añadimos !important para forzar el color */}
        <LinkContainer to="/">
          <BSNavbar.Brand style={{ color: '#ffffff !important', fontWeight: 'bold' }}>KEEPLIC</BSNavbar.Brand>
        </LinkContainer>

        {/* Botón de alternancia para móviles */}
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Contenido colapsable de la barra de navegación */}
        <BSNavbar.Collapse id="basic-navbar-nav">
          {/* Navegación principal */}
          <Nav className="me-auto">

            {/* DashBoards - Ver Reportes */}
            {canViewReports && (
              <LinkContainer to="/reportes">
                <Nav.Link>Ver Reportes</Nav.Link>
              </LinkContainer>
            )}

            {/* Dropdown: Productos */}
            {showProductsDropdown && (
              <NavDropdown title="Productos" id="nav-dropdown-productos">
                {canViewProducts && (
                  <LinkContainer to="/ver/productos">
                    <NavDropdown.Item>Visualizar mis productos</NavDropdown.Item>
                  </LinkContainer>
                )}
                {(canViewProducts && (canAddProduct || canEditDeleteProducts)) && <NavDropdown.Divider />} 
                {canAddProduct && (
                  <LinkContainer to="/productos/agregar">
                    <NavDropdown.Item>Agregar nuevo producto</NavDropdown.Item>
                  </LinkContainer>
                )}
                {canEditDeleteProducts && (
                  <LinkContainer to="/editar/eliminarclientes">
                    <NavDropdown.Item>Editar o eliminar producto</NavDropdown.Item>
                  </LinkContainer>
                )}
              </NavDropdown>
            )}

            {/* Dropdown: Catálogos/Globales - Crear Datos */}
            {showCreateDatosDropdown && (
              <NavDropdown title="Crear Datos" id="nav-dropdown-catalogos">
                {canViewProveedores && (
                  <LinkContainer to="/proveedores">
                    <NavDropdown.Item>Proveedores</NavDropdown.Item>
                  </LinkContainer>
                )}
                {canViewMarcas && (
                  <LinkContainer to="/marcas">
                    <NavDropdown.Item>Marcas</NavDropdown.Item>
                  </LinkContainer>
                )}
                {canViewCategorias && (
                  <LinkContainer to="/categorias">
                    <NavDropdown.Item>Categorías</NavDropdown.Item>
                  </LinkContainer>
                )}
                {canViewFormasPago && (
                  <LinkContainer to="/formas-pago">
                    <NavDropdown.Item>Formas de Pago</NavDropdown.Item>
                  </LinkContainer>
                )}
              </NavDropdown>
            )}

            {/* Dropdown: Configuración de Usuarios */}
            {showUserConfigDropdown && (
              <NavDropdown title="Configuración Usuarios" id="nav-dropdown-accesos">
                {canViewRoles && (
                  <LinkContainer to="/roles">
                    <NavDropdown.Item>Roles</NavDropdown.Item>
                  </LinkContainer>
                )}
                {(canViewRoles && (canViewUsuarios || canViewPermisos)) && <NavDropdown.Divider />}
                {canViewUsuarios && (
                  <LinkContainer to="/usuarios">
                    <NavDropdown.Item>Usuarios</NavDropdown.Item>
                  </LinkContainer>
                )}
                {canViewPermisos && (
                  <LinkContainer to="/permisos">
                    <NavDropdown.Item>Permisos</NavDropdown.Item>
                  </LinkContainer>
                )}
              </NavDropdown>
            )}

            {/* Punto de Venta / Ventas Dropdown */}
            {showVentasDropdown && (
              <NavDropdown title="Ventas" id="nav-dropdown-ventas">
                {canCreateClient && (
                  <LinkContainer to="/clientes">
                    <NavDropdown.Item>Crear Cliente</NavDropdown.Item>
                  </LinkContainer>
                )}
                {canGenerateSale && (
                  <LinkContainer to="/pos">
                    <NavDropdown.Item>Generar Venta</NavDropdown.Item>
                  </LinkContainer>
                )}
                {((canCreateClient || canGenerateSale) && canViewFacturas) && <NavDropdown.Divider />}
                {canViewFacturas && (
                  <LinkContainer to="/facturas">
                    <NavDropdown.Item>Ver Facturas</NavDropdown.Item>
                  </LinkContainer>
                )}
              </NavDropdown>
            )}

          </Nav>

          {/* Sección de usuario/autenticación */}
          <Nav>
            {user ? (
              <NavDropdown
                title={`Hola, ${user.username || user.email}!`}
                id="nav-dropdown-user"
                align="end"
              >
                <NavDropdown.Item 
                    onClick={logoutUser}
                    style={{ 
                        backgroundColor: '#00b45c', 
                        color: '#ffffff' 
                    }}
                >
                  Cerrar Sesión
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <LinkContainer to="/login">
                <Nav.Link>Iniciar Sesión</Nav.Link>
              </LinkContainer>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;