import React, { useState, useEffect, useCallback } from 'react';
// Asegúrate de que esta ruta sea correcta para tu archivo CSS
// Si POSPage.js está en src/pages/ y POSPage.css está en src/styles/, esta ruta es correcta:
import '../styles/POSPage.css'; 

const POSPage = () => {
  // --- Estados para Productos ---
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);

  // --- Estados para Carrito de Compras ---
  const [cartItems, setCartItems] = useState([]); // [{ product: {}, quantity: N, subtotal: M }]

  // --- Estados para Cliente ---
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientError, setClientError] = useState(null);

  // --- Estados para Forma de Pago ---
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [paymentMethodError, setPaymentMethodError] = useState(null);

  // --- Estados para Procesamiento de Venta ---
  const [processingSale, setProcessingSale] = useState(false);
  const [saleMessage, setSaleMessage] = useState(null); // { type: 'success'|'error'|'info', text: 'Mensaje' }
  const [showSaleConfirmationModal, setShowSaleConfirmationModal] = useState(false);
  const [saleResult, setSaleResult] = useState(null); // Datos de la factura creada


  // --- Helper para URL de Imagen (ajusta según tu configuración de Django) ---
  const getProductImageUrl = (imagePath) => {
    if (!imagePath) {
      // Ruta a una imagen por defecto si el producto no tiene foto
      return '/path/to/default_image.png'; // Cambia esto por una imagen de tu proyecto
    }
    // Si Django sirve imágenes desde /media/ y tu campo 'imagen' guarda solo el nombre o ruta relativa
    // return `http://localhost:8000/media/${imagePath}`;
    // Si tu campo 'imagen' ya guarda la URL completa (ej. de un CDN o URL absoluta), usa directamente
    return imagePath;
  };

  // --- Funciones de Carga de Datos Iniciales ---

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const response = await fetch('http://localhost:8000/api/productos/');
      if (!response.ok) {
        throw new Error(`Error al cargar productos: ${response.statusText}`);
      }
      const data = await response.json();
      // MODIFICACION: Convertir precio_venta a número al cargar
      const processedData = data.map(product => ({
        ...product,
        precio_venta: parseFloat(product.precio_venta) || 0 // Asegura que sea un número, o 0 si es inválido
      }));
      setProducts(processedData);
      setFilteredProducts(processedData); // Inicialmente, todos los productos están filtrados
    } catch (err) {
      console.error("Error fetching products:", err);
      setProductError("No se pudieron cargar los productos.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    setClientError(null);
    try {
      const response = await fetch('http://localhost:8000/api/clientes/');
      if (!response.ok) {
        throw new Error(`Error al cargar clientes: ${response.statusText}`);
      }
      const data = await response.json();
      setClients(data);
      setFilteredClients(data); // Inicialmente, todos los clientes están filtrados
    } catch (err) {
      console.error("Error fetching clients:", err);
      setClientError("No se pudieron cargar los clientes.");
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    setLoadingPaymentMethods(true);
    setPaymentMethodError(null);
    try {
      // MODIFICACION: Cambiado a 'formas-pago' con guion
      const response = await fetch('http://localhost:8000/api/formas_pago/'); 
      if (!response.ok) {
        throw new Error(`Error al cargar formas de pago: ${response.statusText}`);
      }
      const data = await response.json();
      setPaymentMethods(data);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      setPaymentMethodError("No se pudieron cargar las formas de pago.");
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchClients();
    fetchPaymentMethods();
  }, [fetchProducts, fetchClients, fetchPaymentMethods]); // Dependencias para useCallback

  // --- Lógica de Filtrado de Productos ---
  useEffect(() => {
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = products.filter(product =>
        product.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.referencia_producto.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  // --- Lógica de Filtrado de Clientes ---
  useEffect(() => {
    if (clientSearchTerm) {
      const lowerCaseSearchTerm = clientSearchTerm.toLowerCase();
      const filtered = clients.filter(client =>
        client.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        (client.email && client.email.toLowerCase().includes(lowerCaseSearchTerm)) || // Agregado check para email
        (client.telefono && client.telefono.includes(lowerCaseSearchTerm)) // Agregado check para telefono
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearchTerm, clients]);


  // --- Lógica del Carrito ---

  const handleAddProductToCart = (productToAdd) => {
    setSaleMessage(null); // Limpiar mensajes al añadir producto

    const existingItemIndex = cartItems.findIndex(item => item.product.referencia_producto === productToAdd.referencia_producto);

    if (existingItemIndex > -1) {
      // Si el producto ya está en el carrito, incrementa la cantidad
      const updatedCart = cartItems.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + 1;
          if (newQuantity > productToAdd.stock) {
            setSaleMessage({ type: 'error', text: `Stock insuficiente para ${productToAdd.nombre}.` });
            return item; // No actualizar si excede el stock
          }
          // MODIFICACION: Asegurar que subtotal se calcule con números
          const newSubtotal = parseFloat(newQuantity * productToAdd.precio_venta) || 0;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newSubtotal,
          };
        }
        return item;
      });
      setCartItems(updatedCart);
    } else {
      // Si el producto no está en el carrito, añádelo
      if (productToAdd.stock <= 0) {
        setSaleMessage({ type: 'error', text: `Producto "${productToAdd.nombre}" sin stock disponible.` });
        return;
      }
      setCartItems([
        ...cartItems,
        {
          product: productToAdd,
          quantity: 1,
          subtotal: parseFloat(productToAdd.precio_venta) || 0, // Inicia subtotal como número
        },
      ]);
    }
  };

  const updateItemQuantity = (productRef, newQuantity) => {
    setSaleMessage(null);
    const updatedCart = cartItems.map(item => {
      if (item.product.referencia_producto === productRef) {
        if (newQuantity <= 0) {
          // Si la cantidad es 0 o menos, remover el item
          return null; // Marcar para eliminación
        }
        if (newQuantity > item.product.stock) {
          setSaleMessage({ type: 'error', text: `No hay suficiente stock para ${item.product.nombre}. Max: ${item.product.stock}` });
          return item;
        }
        // MODIFICACION: Asegurar que subtotal se calcule con números
        const newSubtotal = parseFloat(newQuantity * item.product.precio_venta) || 0;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newSubtotal,
        };
      }
      return item;
    }).filter(Boolean); // Eliminar los items marcados como null
    setCartItems(updatedCart);
  };

  const removeItemFromCart = (productRef) => {
    setSaleMessage(null);
    setCartItems(cartItems.filter(item => item.product.referencia_producto !== productRef));
  };

  const calculateTotal = () => {
    // MODIFICACION: Asegurar que la suma se hace con números válidos
    return cartItems.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
  };

  const handleClearCart = () => {
    setCartItems([]);
    setSelectedClient(null);
    setSelectedPaymentMethod(null);
    setSaleMessage(null);
    setSaleResult(null);
    setShowSaleConfirmationModal(false);
  };

  // --- Lógica de Procesamiento de Venta ---
  const handleProcessSale = async () => {
    if (cartItems.length === 0) {
      setSaleMessage({ type: 'error', text: 'El carrito de compras está vacío.' });
      return;
    }
    if (!selectedClient) {
      setSaleMessage({ type: 'error', text: 'Por favor, selecciona un cliente.' });
      return;
    }
    if (!selectedPaymentMethod) {
      setSaleMessage({ type: 'error', text: 'Por favor, selecciona una forma de pago.' });
      return;
    }

    setProcessingSale(true);
    setSaleMessage({ type: 'info', text: 'Procesando venta...' });

    const saleData = {
      cliente: selectedClient.id,
      forma_pago: selectedPaymentMethod.id,
      total: calculateTotal().toFixed(2), // Total ya es un número por calculateTotal()
      estado: 'completada', // O el estado inicial que quieras (ej. 'pendiente')
      // Si tienes un usuario autenticado en el frontend, podrías enviarlo así:
      // usuario: ID_DEL_USUARIO_AUTENTICADO,
      detalle_ventas: cartItems.map(item => ({
        producto: item.product.referencia_producto, // Usar referencia_producto como PK del producto
        cantidad: item.quantity,
        // MODIFICACION: Asegurar que precio_unitario es número
        precio_unitario: parseFloat(item.product.precio_venta) || 0,
        // MODIFICACION: Asegurar que subtotal es número antes de toFixed
        subtotal: (parseFloat(item.subtotal) || 0).toFixed(2),
      })),
    };

    try {
      const response = await fetch('http://localhost:8000/api/facturas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`, // Si usas autenticación
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al procesar venta:", errorData);
        // Intentar obtener un mensaje de error más específico
        let errorMessage = 'Error desconocido al procesar la venta.';
        if (errorData && typeof errorData === 'object') {
            if (errorData.non_field_errors) {
                errorMessage = errorData.non_field_errors.join(' ');
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else {
                // Iterar sobre los errores de campo si existen
                const fieldErrors = Object.keys(errorData).map(key => `${key}: ${errorData[key]}`).join('; ');
                if (fieldErrors) {
                    errorMessage = `Errores de validación: ${fieldErrors}`;
                }
            }
        } else if (typeof errorData === 'string') {
            errorMessage = errorData;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSaleResult(result); // Guarda la factura creada
      setShowSaleConfirmationModal(true); // Muestra modal de confirmación
      setSaleMessage({ type: 'success', text: `¡Venta procesada con éxito! Factura #${result.id_factura}` });
      handleClearCart(); // Limpiar el carrito después de una venta exitosa
      fetchProducts(); // Recargar productos para reflejar cambios de stock

    } catch (err) {
      console.error("Error en handleProcessSale:", err);
      setSaleMessage({ type: 'error', text: `No se pudo procesar la venta: ${err.message || 'Error desconocido'}` });
    } finally {
      setProcessingSale(false);
    }
  };


  return (
    <div className="pos-container">
      {/* Sección de Mensajes Globales */}
      {saleMessage && (
        <div className={`global-message ${saleMessage.type}`}>
          {saleMessage.text}
        </div>
      )}

      {/* Sección de Selección de Productos */}
      <div className="pos-section product-selection">
        <h2>Productos</h2>
        <input
          type="text"
          placeholder="Buscar producto por nombre o referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {loadingProducts && <p className="loading-text">Cargando productos...</p>}
        {productError && <p className="error-message">{productError}</p>}
        <div className="product-list">
          {filteredProducts.length === 0 && !loadingProducts && !productError && <p>No se encontraron productos.</p>}
          {filteredProducts.map(product => (
            <div key={product.referencia_producto} className="product-card">
              <img
                src={getProductImageUrl(product.imagen)}
                alt={product.nombre}
                className="product-image"
              />
              <div className="product-info">
                <h3>{product.nombre}</h3>
                <p>Ref: {product.referencia_producto}</p>
                {/* Asegúrate que product.precio_venta ya es un número válido aquí */}
                <p>Precio: **${product.precio_venta.toFixed(2)}**</p>
                <p>Stock: {product.stock}</p>
              </div>
              <button
                onClick={() => handleAddProductToCart(product)}
                disabled={product.stock <= 0}
                className="add-to-cart-button"
              >
                {product.stock <= 0 ? 'Sin Stock' : 'Añadir al Carrito'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sección del Carrito de Compras */}
      <div className="pos-section cart-details">
        <h2>Carrito de Compras</h2>
        {cartItems.length === 0 ? (
          <p className="empty-cart-message">El carrito está vacío. Añade productos para empezar.</p>
        ) : (
          <>
            <div className="cart-item-list">
              {cartItems.map(item => (
                <div key={item.product.referencia_producto} className="cart-item">
                  <img
                    src={getProductImageUrl(item.product.imagen)}
                    alt={item.product.nombre}
                    className="cart-item-image"
                  />
                  <div className="item-info">
                    <h3>{item.product.nombre}</h3>
                    <p>Cant: {item.quantity}</p>
                    {/* Asegúrate que item.product.precio_venta y item.subtotal ya son números válidos */}
                    <p>Unitario: ${item.product.precio_venta.toFixed(2)}</p>
                    <p>Subtotal: ${item.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="item-quantity-controls">
                    <button onClick={() => updateItemQuantity(item.product.referencia_producto, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(item.product.referencia_producto, item.quantity + 1)}>+</button>
                    <button className="remove-button" onClick={() => removeItemFromCart(item.product.referencia_producto)}>X</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <h3>Total Carrito: **${calculateTotal().toFixed(2)}**</h3>
            </div>
          </>
        )}
      </div>

      {/* Sección de Controles de Venta (Cliente y Forma de Pago) */}
      <div className="pos-section sale-controls">
        <h2>Detalles de la Venta</h2>
        <div className="control-group">
          <label htmlFor="client-select">Cliente:</label>
          <input
            type="text"
            placeholder="Buscar o seleccionar cliente..."
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
            className="search-input"
          />
          {loadingClients && <p className="loading-text">Cargando clientes...</p>}
          {clientError && <p className="error-message">{clientError}</p>}
          {/* Usamos un select para el cliente para facilitar la selección después de la búsqueda */}
          <select
            id="client-select"
            value={selectedClient ? selectedClient.id : ''}
            onChange={(e) => setSelectedClient(clients.find(c => c.id === parseInt(e.target.value)))}
            className="select-input"
          >
            <option value="">Seleccionar Cliente</option>
            {filteredClients.map(client => (
              <option key={client.id} value={client.id}>{client.nombre} ({client.email || 'N/A'})</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="payment-method-select">Forma de Pago:</label>
          {loadingPaymentMethods && <p className="loading-text">Cargando formas de pago...</p>}
          {paymentMethodError && <p className="error-message">{paymentMethodError}</p>}
          <select
            id="payment-method-select"
            value={selectedPaymentMethod ? selectedPaymentMethod.id : ''}
            onChange={(e) => setSelectedPaymentMethod(paymentMethods.find(pm => pm.id === parseInt(e.target.value)))}
            className="select-input"
          >
            <option value="">Seleccionar Forma de Pago</option>
            {paymentMethods.map(pm => (
              <option key={pm.id} value={pm.id}>{pm.metodo}</option>
            ))}
          </select>
        </div>

        <div className="action-buttons">
          <button onClick={handleClearCart} disabled={cartItems.length === 0} className="clear-cart-button">
            Vaciar Carrito
          </button>
          <button
            onClick={handleProcessSale}
            disabled={processingSale || cartItems.length === 0 || !selectedClient || !selectedPaymentMethod}
            className="process-sale-button"
          >
            {processingSale ? 'Procesando...' : `Generar Factura ($${calculateTotal().toFixed(2)})`}
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Venta */}
      {showSaleConfirmationModal && saleResult && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Factura Generada con Éxito</h3>
            <p>ID de Factura: **{saleResult.id_factura}**</p>
            {/* Asegúrate que saleResult.total es número válido */}
            <p>Total: **${parseFloat(saleResult.total).toFixed(2)}**</p>
            {/* Estos campos (cliente_nombre, forma_pago_nombre) se asumen que el backend los devuelve en la respuesta de la factura */}
            <p>Cliente: {saleResult.cliente_nombre || 'N/A'}</p>
            <p>Forma de Pago: {saleResult.forma_pago_nombre || 'N/A'}</p>
            <button onClick={() => setShowSaleConfirmationModal(false)} className="close-modal-button">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;