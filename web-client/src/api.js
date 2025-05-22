import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

export const getProveedores = () => API.get('proveedores/');
export const getCategorias = () => API.get('categorias/');
export const getClientes = () => API.get('clientes/');
export const getFormasPago = () => API.get('formas-pago/');
export const getProductos = () => API.get('productos/');
export const getFacturas = () => API.get('facturas/');
export const getDetalleVentas = () => API.get('detalle-ventas/');
export const getRoles = () => API.get('roles/');
export const getPermisos = () => API.get('permisos/');
export const getUsuarios = () => API.get('usuarios/');