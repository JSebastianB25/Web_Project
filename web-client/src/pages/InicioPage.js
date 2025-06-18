import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import usePermission from '../hooks/usePermission'; // Tu hook de permisos
import '../styles/Inicio.css'; // Importa tus estilos personalizados (renombrado)

// Importa los iconos de Font Awesome que instalaste
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserCog, faUsers, faKey, faPlusCircle, faTags, faHandshake,
    faBoxes, faCreditCard, faUserFriends, faEdit, faEye, faCashRegister,
    faFileInvoice, faChartBar, faHome, faUserShield // Añadido faUserShield para "Gestionar Roles y Permisos"
} from '@fortawesome/free-solid-svg-icons'; // Iconos específicos

// Componente auxiliar para renderizar los módulos
const ModuleCard = ({ title, description, link, icon, hasPermission }) => {
    const navigate = useNavigate();

    if (!hasPermission) {
        return null; // No renderiza el módulo si no tiene permiso
    }

    // Determina si es un botón de acción principal (verde) o uno de información (azul)
    const isMainAction = link === '/pos' || link === '/productos/agregar';

    return (
        <Col xs={12} sm={6} md={4} lg={3} className="mb-4 d-grid">
            <Card className="module-card">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                    <FontAwesomeIcon icon={icon} size="3x" className="module-icon mb-3" />
                    <Card.Title className="module-title">{title}</Card.Title>
                    <Card.Text className="module-description">{description}</Card.Text>
                    <Button
                        variant={isMainAction ? "success" : "info"} // Verde para acciones principales, azul para info
                        onClick={() => navigate(link)}
                        className={`module-button mt-auto ${isMainAction ? 'btn-main-action' : 'btn-info-action'}`} // Clases para estilos personalizados
                        size="md" // <-- Tamaño mediano
                    >
                        Acceder
                    </Button>
                </Card.Body>
            </Card>
        </Col>
    );
};


const InicioPage = () => {
    const navigate = useNavigate();
    // Aquí verificamos los permisos. Estos son los mismos que ya usamos en App.js.
    const canAccessRoles = usePermission('Acceso total');
    const canAccessUsuarios = usePermission('Acceso total');
    const canAccessPermisos = usePermission('Acceso total');

    const canAccessAddProduct = usePermission('Acceso total') || usePermission('Acceso administrador');
    const canAccessMarcas = usePermission('Acceso total') || usePermission('Acceso administrador');
    const canAccessProveedores = usePermission('Acceso total') || usePermission('Acceso administrador');
    const canAccessCategorias = usePermission('Acceso total') || usePermission('Acceso administrador');

    const canAccessInventario = usePermission('Acceso total') || usePermission('Acceso administrador');
    const canAccessVentas = usePermission('Acceso total') || usePermission('Acceso administrador') || usePermission('Acceso vendedor');
    const canAccessFacturas = usePermission('Acceso total') || usePermission('Acceso administrador');
    const canAccessReportes = usePermission('Acceso total') || usePermission('Acceso administrador');

    // Determina si no hay módulos accesibles para mostrar un mensaje
    const noModulesAccessible = !(
        canAccessRoles || canAccessUsuarios || canAccessPermisos ||
        canAccessAddProduct || canAccessMarcas || canAccessProveedores || canAccessCategorias ||
        canAccessInventario || canAccessVentas || canAccessFacturas || canAccessReportes
    );

    return (
        <Container
            fluid
            className="inicio-page p-4" // Añadido p-4 para padding general
            style={{
                minHeight: 'calc(100vh - 56px)', // Ajusta a la altura de tu Navbar
                backgroundColor: '#ffffff', // Fondo blanco para la página
                color: '#000000' // Texto negro por defecto
            }}
        >
            <h2
                className="mb-4 text-center"
                style={{ color: '#000000', fontWeight: 'bold' }} // Título principal en negro
            >
                <FontAwesomeIcon icon={faHome} className="me-3" /> Dashboard Principal
            </h2>

            <Row className="justify-content-center">
                {/* Módulos de Gestión de Usuarios y Permisos */}
                <ModuleCard
                    title="Gestionar Roles"
                    description="Administra los roles de usuario y sus permisos asociados."
                    link="/roles"
                    icon={faUserCog}
                    hasPermission={canAccessRoles}
                />
                <ModuleCard
                    title="Gestionar Usuarios"
                    description="Crea, edita y desactiva cuentas de usuario del sistema."
                    link="/usuarios"
                    icon={faUsers}
                    hasPermission={canAccessUsuarios}
                />
                <ModuleCard
                    title="Gestionar Permisos"
                    description="Define y asigna permisos detallados a cada rol."
                    link="/permisos"
                    icon={faKey}
                    hasPermission={canAccessPermisos}
                />
                
                {/* Módulos de Gestión de Productos */}
                <ModuleCard
                    title="Agregar Producto"
                    description="Añade nuevos productos al inventario del sistema."
                    link="/productos/agregar"
                    icon={faPlusCircle}
                    hasPermission={canAccessAddProduct}
                />
                <ModuleCard
                    title="Gestionar Marcas"
                    description="Administra las marcas de los productos."
                    link="/marcas"
                    icon={faTags}
                    hasPermission={canAccessMarcas}
                />
                <ModuleCard
                    title="Gestionar Proveedores"
                    description="Administra la información de los proveedores."
                    link="/proveedores"
                    icon={faHandshake}
                    hasPermission={canAccessProveedores}
                />
                 <ModuleCard
                    title="Gestionar Categorías"
                    description="Organiza los productos por categorías."
                    link="/categorias"
                    icon={faBoxes}
                    hasPermission={canAccessCategorias}
                />

                {/* Módulos de Operación y Reportes */}
                <ModuleCard
                    title="Punto de Venta (POS)"
                    description="Realiza ventas rápidas y eficientes en el punto de venta."
                    link="/pos"
                    icon={faCashRegister}
                    hasPermission={canAccessVentas}
                />
                <ModuleCard
                    title="Historial de Facturas"
                    description="Consulta y gestiona todas las facturas emitidas."
                    link="/facturas"
                    icon={faFileInvoice}
                    hasPermission={canAccessFacturas}
                />
                <ModuleCard
                    title="Ver Reportes"
                    description="Accede a análisis y reportes del negocio."
                    link="/reportes"
                    icon={faChartBar}
                    hasPermission={canAccessReportes}
                />

                {/* Este mensaje se muestra si el usuario no tiene acceso a NINGÚN módulo */}
                {noModulesAccessible && (
                    <Col xs={12} className="text-center mt-5">
                        <Card
                            className="p-4 shadow-sm module-card-no-access" // Clase para estilos específicos
                            style={{
                                backgroundColor: '#ffffff', // Fondo blanco para la tarjeta
                                borderColor: '#00b45c', // Borde de alerta verde
                                color: '#000000' // Texto negro
                            }}
                        >
                            <Card.Body>
                                <FontAwesomeIcon icon={faHome} size="3x" className="text-info mb-3" style={{ color: '#00b45c' }} />
                                <Card.Title className="text-info" style={{ color: '#00b45c' }}>Sin Acceso a Módulos</Card.Title>
                                <Card.Text style={{ color: '#333333' }}> {/* Texto en gris oscuro */}
                                    Actualmente no tienes permisos para acceder a ningún módulo.
                                    Por favor, contacta al administrador del sistema para solicitar acceso.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>
        </Container>
    );
};

export default InicioPage;