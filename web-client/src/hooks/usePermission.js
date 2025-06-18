// src/hooks/usePermission.js

import { useAuth } from '../context/AuthContext';

const usePermission = (permissionName) => {
    const { user } = useAuth();

    // Si no hay usuario o no hay datos de rol/permisos, no tiene el permiso
    if (!user || !user.rol_data || !user.rol_data.permisos) {
        return false;
    }

    // Comprobamos si el array de permisos del usuario contiene el 'permissionCode'
    // Asumimos que los permisos en user.rol_data.permisos tienen una propiedad 'codigo'
    const hasPermission = user.rol_data.permisos.some(
        (permission) => permission.nombre === permissionName
    );

    return hasPermission;
};

export default usePermission;