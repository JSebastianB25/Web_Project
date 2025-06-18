// src/components/PrivateRoute.js

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// El componente ahora acepta un prop 'requiredPermissions'
const PrivateRoute = ({ requiredPermissions = [] }) => {
    const { user, loading } = useAuth();

    // Mientras carga, muestra un indicador
    if (loading) {
        return <div>Cargando contenido...</div>; // Puedes reemplazar esto con un spinner/loader más elaborado
    }

    // 1. Verificar autenticación: Si no hay usuario logueado, redirigir a /login
    if (!user) {
        console.warn("Acceso denegado: Usuario no autenticado. Redirigiendo a login.");
        return <Navigate to="/login" replace />;
    }

    // 2. Verificar permisos: Si se requieren permisos específicos, validarlos
    if (requiredPermissions.length > 0) {
        // Obtenemos los códigos de los permisos del usuario logueado
        // Asumimos que cada permiso en user.rol_data.permisos tiene una propiedad 'codigo'
        const userPermissionCodes = user.rol_data?.permisos?.map(p => p.nombre) || [];

        // Comprobamos si el usuario tiene AL MENOS UNO de los permisos requeridos
        const hasRequiredPermission = requiredPermissions.some(rp => userPermissionCodes.includes(rp));

        if (!hasRequiredPermission) {
            console.warn(`Acceso denegado: El usuario "${user.username}" no tiene los permisos requeridos (${requiredPermissions.join(', ')}).`);
            // Redirigir a una página de acceso denegado o a la página de inicio
            // Debes crear una página '/acceso-denegado' o redirigir a '/'
            return <Navigate to="/acceso-denegado" replace />;
        }
    }

    // Si el usuario está autenticado y tiene los permisos necesarios, renderizar el componente solicitado
    return <Outlet />;
};

export default PrivateRoute;