// web-client/src/Navbar.js

import React from 'react';
// Importamos Navbar de react-bootstrap como BSNavbar para evitar conflicto de nombres con nuestro componente 'Navbar'
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap'; 
import { LinkContainer } from 'react-router-bootstrap'; // Necesario para integrar react-router-dom con Nav.Link

// Este es TU COMPONENTE Navbar
const Navbar = () => { 
  return (
    // Aquí usamos el componente Navbar de react-bootstrap, importado como BSNavbar
    <BSNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* Marca/Logo de la aplicación, que lleva a la página de inicio */}
        <LinkContainer to="/">
          <BSNavbar.Brand>Gestor de Inventarios</BSNavbar.Brand>
        </LinkContainer>

        {/* Botón para colapsar/expandir el menú en dispositivos pequeños */}
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Contenido del menú */}
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto"> 
            <LinkContainer to="/">
              <Nav.Link>Inicio</Nav.Link>
            </LinkContainer>

            <LinkContainer to="/productos/agregar">
              <Nav.Link>Agregar Producto</Nav.Link>
            </LinkContainer>
            
            {/* Enlace para la página de Gestionar Marcas */}
            <LinkContainer to="/marcas">
              <Nav.Link>Gestionar Marcas</Nav.Link>
            </LinkContainer>

            {/* --- NUEVO ENLACE A PROVEEDORES --- */}
            <LinkContainer to="/proveedores">
              <Nav.Link>Gestionar Proveedores</Nav.Link>
            </LinkContainer>

            {/* --- NUEVO ENLACE A CATEGORÍAS --- */}
            <LinkContainer to="/categorias">
              <Nav.Link>Gestionar Categorías</Nav.Link>
            </LinkContainer>
            {/* --- NUEVO ENLACE A FORMAS DE PAGO --- */}
            <LinkContainer to="/formas-pago">
              <Nav.Link>Gestionar Formas de Pago</Nav.Link> 
            </LinkContainer>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;