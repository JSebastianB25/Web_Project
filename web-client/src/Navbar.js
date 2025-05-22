// src/components/Navbar.js
import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom'; // Make sure you have react-router-dom installed

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null); // Para detectar clics fuera

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Cerrar menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper to close the dropdown when a sub-item is clicked
  const handleMenuItemClick = () => {
    setOpenMenu(null);
  };

  const menuItems = [
    {
      label: "Productos",
      key: "productos",
      subItems: [
        { label: "Crear Productos", href: "/crear-productos" },
        { label: "Editar Productos", href: "/editar-productos" },
        { label: "Eliminar Productos", href: "/eliminar-productos" },
      ],
    },
    {
      label: "Gestionar Accesos",
      key: "accesos",
      subItems: [
        { label: "Roles", href: "/roles" },
        { label: "Permisos", href: "/permisos" },
        { label: "Usuarios", href: "/usuarios" },
      ],
    },
    {
      label: "Ventas",
      key: "ventas",
      subItems: [        
        { label: "Realizar Venta", href: "/pos" },
        { label: "Facturas", href: "/facturas" },
        { label: "Detalle Venta", href: "/detalles-venta" },
      ],
    },
    {
      label: "Administrar",
      key: "administrar",
      subItems: [
        { label: "Clientes", href: "/clientes" },
        { label: "Formas de Pago", href: "/formas-pago" },
        { label: "Categorías", href: "/categorias" },
        { label: "Proveedores", href: "/proveedores" },
      ],
    },
  ];

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-logo">
        <Link to="/" onClick={handleMenuItemClick}>🚀 Gestor de Inventarios </Link> {/* Changed to Link */}
      </div>
      <ul className="navbar-menu">
        <li>
          <Link to="/" className="navbar-item" onClick={handleMenuItemClick}>Inicio</Link> {/* Changed to Link */}
        </li>

        {menuItems.map((item) => (
          <li key={item.key} className={`navbar-item-dropdown ${openMenu === item.key ? "open" : ""}`}>
            <button
              onClick={() => toggleMenu(item.key)}
              className="navbar-item dropdown-toggle"
              aria-expanded={openMenu === item.key}
              aria-controls={`dropdown-${item.key}`}
            >
              {item.label} <span className="dropdown-arrow">▼</span>
            </button>
            {openMenu === item.key && (
              <ul className="dropdown-menu" id={`dropdown-${item.key}`}>
                {item.subItems.map((subItem) => (
                  <li key={subItem.href}>
                    {/* Keep <a> for now as requested, but recommend changing to Link for internal routes */}
                    <a href={subItem.href} className="dropdown-item" onClick={handleMenuItemClick}>{subItem.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;