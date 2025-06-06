// web-client/src/Navbar.js

import React from 'react';
import { Navbar as BSNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Navbar = () => {
  return (
    <BSNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <LinkContainer to="/">
          <BSNavbar.Brand>Gestor de Inventarios</BSNavbar.Brand>
        </LinkContainer>

        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Inicio */}
            <LinkContainer to="/">
              <Nav.Link>Inicio</Nav.Link>
            </LinkContainer>

            {/* Dropdown: Productos - ¡CORRECCIÓN AQUÍ! */}
            <NavDropdown title="Productos" id="nav-dropdown-productos">
              <LinkContainer to="/ver/productos">
                <NavDropdown.Item>Ver Todos</NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <LinkContainer to="/productos/agregar">
                <NavDropdown.Item>Agregar Nuevo</NavDropdown.Item>
              </LinkContainer>
              {/* ¡Mueve el Divider FUERA de cualquier LinkContainer! */}
              
              <LinkContainer to="/editar/eliminarclientes">
                <NavDropdown.Item>Editar o Eliminar</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>

            {/* Dropdown: Clientes */}
            <NavDropdown title="Clientes" id="nav-dropdown-clientes">
              <LinkContainer to="/clientes">
                <NavDropdown.Item>Ver Todos</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/clientes/agregar">
                <NavDropdown.Item>Agregar Nuevo</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>

            {/* Dropdown: Proveedores */}
            <NavDropdown title="Proveedores" id="nav-dropdown-proveedores">
              <LinkContainer to="/proveedores">
                <NavDropdown.Item>Ver Todos</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/proveedores/agregar">
                <NavDropdown.Item>Agregar Nuevo</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>

            {/* Dropdown: Catálogos/Globales */}
            <NavDropdown title="Catálogos" id="nav-dropdown-catalogos">
              <LinkContainer to="/marcas">
                <NavDropdown.Item>Marcas</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/categorias">
                <NavDropdown.Item>Categorías</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/formas-pago">
                <NavDropdown.Item>Formas de Pago</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>

            <NavDropdown title="Administrar Accesos" id="nav-dropdown-accesos">
              <LinkContainer to="/roles">
                <NavDropdown.Item>Roles</NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <LinkContainer to="/usuarios">
                <NavDropdown.Item>Usuarios</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/permisos">
                <NavDropdown.Item>Permisos</NavDropdown.Item>
              </LinkContainer>
              </NavDropdown>
            
            {/* Punto de Venta */}
            <NavDropdown title="Ventas" id="nav-dropdown-ventas">
              <LinkContainer to="/pos">
                <NavDropdown.Item>Generar Venta</NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <LinkContainer to="/facturas">
                <NavDropdown.Item>Ver Facturas</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/otros">
                <NavDropdown.Item>Otros</NavDropdown.Item>
              </LinkContainer>
              </NavDropdown>


          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;