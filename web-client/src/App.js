import React, { useEffect, useState } from 'react';
import "./App.css"; // Ensure your App.css is ready for new styles if any
import Navbar from "./Navbar";
import {
    getProveedores, getCategorias, getClientes, getFormasPago,
    getProductos, getFacturas, getDetalleVentas, getRoles,
    getPermisos, getUsuarios
} from './api'; // Assuming your api.js functions return { data: [...] }

// Optional: A simple loading component
const LoadingSpinner = () => (
    <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos...</p>
    </div>
);

// Reusable CardList component
const CardList = ({ title, items, renderItem, placeholder = "No hay datos disponibles." }) => {
    // If items is undefined or null (before fetch completes and sets an array), show loading per card.
    // Or rely on global spinner and just show placeholder if items is an empty array post-fetch.
    // For simplicity with a global spinner, we'll assume 'items' will be an array.
    if (!Array.isArray(items) || items.length === 0) {
        return (
            <div className="card">
                <h2>{title}</h2>
                <p>{placeholder}</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2>{title}</h2>
            <ul>{items.map(item => renderItem(item))}</ul>
        </div>
    );
};

const App = () => {
    // States for data
    const [proveedores, setProveedores] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [productos, setProductos] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [detalleVentas, setDetalleVentas] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permisos, setPermisos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // Global loading state
    const [isLoading, setIsLoading] = useState(true);
    // Global error state (optional, for catastrophic failures)
    // const [globalError, setGlobalError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            // Define all data fetching operations
            const dataFetchOperations = [
                { fetch: getProveedores, set: setProveedores, name: "Proveedores" },
                { fetch: getCategorias, set: setCategorias, name: "Categorías" },
                { fetch: getClientes, set: setClientes, name: "Clientes" },
                { fetch: getFormasPago, set: setFormasPago, name: "Formas de Pago" },
                { fetch: getProductos, set: setProductos, name: "Productos" },
                { fetch: getFacturas, set: setFacturas, name: "Facturas" },
                { fetch: getDetalleVentas, set: setDetalleVentas, name: "Detalle de Ventas" },
                { fetch: getRoles, set: setRoles, name: "Roles" },
                { fetch: getPermisos, set: setPermisos, name: "Permisos" },
                { fetch: getUsuarios, set: setUsuarios, name: "Usuarios" }
            ];

            const results = await Promise.allSettled(
                dataFetchOperations.map(op => op.fetch())
            );

            results.forEach((result, index) => {
                const operation = dataFetchOperations[index];
                if (result.status === 'fulfilled' && result.value.data) {
                    operation.set(result.value.data);
                } else {
                    console.error(`Error al cargar ${operation.name}:`, result.status === 'rejected' ? result.reason : 'Datos no encontrados');
                    operation.set([]); // Set to empty array on error to show "No hay datos"
                }
            });

            setIsLoading(false);
        };

        fetchData();
    }, []);

    // Configuration for rendering cards
    // Make sure key fields are correct (e.g., item.id, item.referencia_producto)
    const cardConfig = [
        { title: "Proveedores", items: proveedores, renderItem: item => <li key={item.id}>{item.nombre}</li> },
        { title: "Categorías", items: categorias, renderItem: item => <li key={item.id}>{item.nombre}</li> },
        { title: "Clientes", items: clientes, renderItem: item => <li key={item.id}>{item.nombre}</li> },
        { 
            title: "Formas de Pago", 
            items: formasPago, 
            // Assuming 'id' exists, otherwise use index as a last resort (item, index) => <li key={index}>
            renderItem: item => <li key={item.id || Math.random()}>{item.nombre || "Dato no disponible"}</li> 
        },
        {
            title: "Productos",
            items: productos,
            renderItem: producto => (
                <li key={producto.referencia_producto}>
                    <img 
                        src={producto.imagen || "https://via.placeholder.com/150?text=No+Image"} 
                        alt={producto.nombre || "Producto sin nombre"} 
                        className="product-image" 
                    />
                    {producto.nombre || "Producto sin nombre"} - ${producto.precio_costo !== undefined ? producto.precio_costo : 'N/A'}
                </li>
            )
        },
        { title: "Facturas", items: facturas, renderItem: item => <li key={item.id}>Factura #{item.id} - Total: ${item.total}</li> },
        { title: "Detalle de Ventas", items: detalleVentas, renderItem: item => <li key={item.id}>Producto ID: {item.producto_id} - Cantidad: {item.cantidad}</li> },
        { title: "Roles", items: roles, renderItem: item => <li key={item.id}>{item.nombre}</li> },
        { title: "Permisos", items: permisos, renderItem: item => <li key={item.id}>{item.nombre}</li> },
        { title: "Usuarios", items: usuarios, renderItem: item => <li key={item.id}>{item.username}</li> }
    ];

    if (isLoading) {
        return (
            <div className="app-container">
                <Navbar />
                <LoadingSpinner />
            </div>
        );
    }

    // Optional: Handle global error if you implement setGlobalError
    // if (globalError) return <p>Error cargando la aplicación: {globalError.message}</p>;

    return (
        <div className="app-container">
            <Navbar />
            <h1>Datos desde Django REST API</h1>
            {cardConfig.map(config => (
                <CardList
                    key={config.title} // Using title as key for CardList instances
                    title={config.title}
                    items={config.items}
                    renderItem={config.renderItem}
                />
            ))}
        </div>
    );
};

export default App;