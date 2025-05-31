// web-client/src/pages/InicioPage.js
import React from 'react';
import { Container } from 'react-bootstrap'; // Importamos Container de react-bootstrap

const InicioPage = () => {
  console.log("InicioPage está renderizando..."); // Esto aparecerá en la consola
  return (
    <Container className="mt-5 text-center">
      <h1>¡Bienvenido a tu Aplicación de Inventario!</h1>
      <p>Navega usando la barra superior.</p>
    </Container>
  );
};

export default InicioPage;