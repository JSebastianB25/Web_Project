// src/pages/POSPage.js
import React, { useState, useEffect, useRef } from 'react';

const POSPage = () => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedClient, setSelectedClient] = useState(''); // Stores client ID
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const productSearchInputRef = useRef(null); // Ref for auto-focus

  const [saleItems, setSaleItems] = useState([]); // [{ product_obj, quantity, subtotal_item }]
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState(null);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState('');

  // --- Fetch Dependencies (Clients, Products, Payment Methods) ---
  useEffect(() => {
    const fetchAllDependencies = async () => {
      try {
        const [clientsRes, productsRes, paymentMethodsRes] = await Promise.all([
          fetch('http://localhost:8000/api/clientes/'),
          fetch('http://localhost:8000/api/productos/'),
          fetch('http://localhost:8000/api/formas-pago/')
        ]);

        if (!clientsRes.ok) throw new Error(`Error al cargar clientes: ${clientsRes.status}`);
        if (!productsRes.ok) throw new Error(`Error al cargar productos: ${productsRes.status}`);
        if (!paymentMethodsRes.ok) throw new Error(`Error al cargar formas de pago: ${paymentMethodsRes.status}`);

        const clientsData = await clientsRes.json();
        const productsData = await productsRes.json();
        const paymentMethodsData = await paymentMethodsRes.json();

        setClients(clientsData);
        setProducts(productsData.filter(p => p.activo && p.stock > 0)); // Only active products with stock
        setPaymentMethods(paymentMethodsData);

      } catch (err) {
        console.error("Error fetching POS dependencies:", err);
        setFetchError(err);
      } finally {
        setLoadingDependencies(false);
        productSearchInputRef.current?.focus(); // Auto-focus product search
      }
    };

    fetchAllDependencies();
  }, []);

  // --- Client Search Logic ---
  useEffect(() => {
    if (clientSearchTerm.length > 1) {
      setFilteredClients(
        clients.filter(client =>
          client.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredClients([]);
    }
  }, [clientSearchTerm, clients]);

  const handleClientSelect = (clientId) => {
    setSelectedClient(clientId);
    setClientSearchTerm(clients.find(c => c.id === clientId)?.nombre || '');
    setFilteredClients([]);
  };

  // --- Product Search Logic ---
  useEffect(() => {
    if (productSearchTerm.length > 1) {
      setFilteredProducts(
        products.filter(product =>
          product.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          product.referencia_producto.toLowerCase().includes(productSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredProducts([]);
    }
  }, [productSearchTerm, products]);

  // --- Add Product to Sale ---
  const addProductToSale = (productToAdd) => {
    // Check if product is already in saleItems
    const existingItemIndex = saleItems.findIndex(item => item.product_obj.referencia_producto === productToAdd.referencia_producto);

    if (existingItemIndex > -1) {
      // If exists, increment quantity
      const updatedSaleItems = saleItems.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + 1;
          if (newQuantity > productToAdd.stock) {
            setSaleError({ message: `No hay suficiente stock para ${productToAdd.nombre}. Stock disponible: ${productToAdd.stock}` });
            return item; // Don't add if exceeds stock
          }
          return {
            ...item,
            quantity: newQuantity,
            subtotal_item: parseFloat((newQuantity * item.product_obj.precio_costo).toFixed(2)) // Using precio_costo as sales price for simplicity
          };
        }
        return item;
      });
      setSaleItems(updatedSaleItems);
    } else {
      // If new, add it
      if (productToAdd.stock === 0) {
        setSaleError({ message: `Producto "${productToAdd.nombre}" sin stock.` });
        return;
      }
      setSaleItems([
        ...saleItems,
        {
          product_obj: productToAdd,
          quantity: 1,
          subtotal_item: parseFloat(productToAdd.precio_costo) // Using precio_costo as sales price for simplicity
        }
      ]);
    }
    setProductSearchTerm(''); // Clear search after adding
    setSaleError(null); // Clear previous errors
    productSearchInputRef.current?.focus(); // Keep focus on search input
  };

  // --- Adjust Item Quantity ---
  const adjustItemQuantity = (ref, delta) => {
    setSaleItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.product_obj.referencia_producto === ref) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null; // Mark for removal
          }
          if (newQuantity > item.product_obj.stock) {
            setSaleError({ message: `No hay suficiente stock para ${item.product_obj.nombre}. Stock disponible: ${item.product_obj.stock}` });
            return item; // Don't allow quantity beyond stock
          }
          setSaleError(null); // Clear previous errors if adjustment is valid
          return {
            ...item,
            quantity: newQuantity,
            subtotal_item: parseFloat((newQuantity * item.product_obj.precio_costo).toFixed(2))
          };
        }
        return item;
      }).filter(Boolean); // Remove nulls (items with quantity <= 0)

      return updatedItems;
    });
  };

  // --- Remove Item from Sale ---
  const removeItemFromSale = (ref) => {
    setSaleItems(saleItems.filter(item => item.product_obj.referencia_producto !== ref));
    setSaleError(null); // Clear previous errors
  };

  // --- Calculate Total ---
  useEffect(() => {
    const newTotal = saleItems.reduce((acc, item) => acc + item.subtotal_item, 0);
    setTotalAmount(parseFloat(newTotal.toFixed(2)));
  }, [saleItems]);

  // --- Clear Sale ---
  const clearSale = () => {
    setSelectedClient('');
    setClientSearchTerm('');
    setSaleItems([]);
    setTotalAmount(0);
    setSelectedPaymentMethod('');
    setSaleError(null);
    setSaleSuccessMessage('');
    productSearchInputRef.current?.focus();
  };

  // --- Process Sale (Submit Factura and DetalleVenta) ---
  const processSale = async () => {
    setSubmittingSale(true);
    setSaleError(null);
    setSaleSuccessMessage('');

    if (!selectedClient) {
      setSaleError({ message: 'Por favor, selecciona un cliente.' });
      setSubmittingSale(false);
      return;
    }
    if (saleItems.length === 0) {
      setSaleError({ message: 'No hay productos en la venta.' });
      setSubmittingSale(false);
      return;
    }
    if (!selectedPaymentMethod) {
      setSaleError({ message: 'Por favor, selecciona una forma de pago.' });
      setSubmittingSale(false);
      return;
    }

    try {
      // 1. Create Factura
      const facturaResponse = await fetch('http://localhost:8000/api/facturas/', { // Adjust API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: selectedClient,
          forma_pago: selectedPaymentMethod,
          total: totalAmount,
          estado: 'completada', // Assuming it's completed on processing
        }),
      });

      if (!facturaResponse.ok) {
        const errorData = await facturaResponse.json();
        throw new Error(`Error al crear factura: ${JSON.stringify(errorData)}`);
      }
      const factura = await facturaResponse.json();
      const facturaId = factura.id_factura;

      // 2. Create DetalleVenta for each item
      for (const item of saleItems) {
        const detalleVentaResponse = await fetch('http://localhost:8000/api/detalle-ventas/', { // Adjust API endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factura: facturaId,
            producto: item.product_obj.referencia_producto, // Use referencia_producto as the FK
            cantidad: item.quantity,
            precio_unitario: item.product_obj.precio_costo, // Assuming precio_costo is the selling price
          }),
        });

        if (!detalleVentaResponse.ok) {
          const errorData = await detalleVentaResponse.json();
          // Potentially handle rollback of factura if detalle_venta fails
          console.error(`Error al crear detalle de venta para ${item.product_obj.nombre}:`, errorData);
          throw new Error(`Error al crear detalle de venta para ${item.product_obj.nombre}.`);
        }
      }

      setSaleSuccessMessage(`Venta (Factura #${facturaId}) procesada exitosamente!`);
      clearSale(); // Reset POS after successful sale

    } catch (err) {
      console.error("Error processing sale:", err);
      setSaleError(err);
    } finally {
      setSubmittingSale(false);
    }
  };

  if (loadingDependencies) {
    return (
      <div className="page-content pos-page-container">
        <div className="loading-message">
          <span role="img" aria-label="loading">⏳</span> Cargando datos para el POS...
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-content pos-page-container">
        <div className="error-message">
          <span role="img" aria-label="error">❌</span> Error: {fetchError.message}
          <p>Asegúrate de que tus APIs de clientes, productos y formas de pago estén funcionando.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content pos-page-container">
      <h2 className="page-heading pos-heading">🛒 Punto de Venta</h2>

      {saleSuccessMessage && (
        <div className="alert-message success-message">
          <span role="img" aria-label="success">✅</span> {saleSuccessMessage}
        </div>
      )}
      {saleError && saleError.message && (
        <div className="alert-message error-message">
          <span role="img" aria-label="error">❌</span> {saleError.message}
        </div>
      )}

      <div className="pos-main-grid">
        {/* Left Column: Client & Product Input */}
        <div className="pos-left-column">
          <div className="pos-section client-section">
            <label htmlFor="client-search" className="pos-label">
              Cliente: <span className="required-field">*</span>
            </label>
            <input
              type="text"
              id="client-search"
              className="form-input pos-input"
              placeholder="Buscar o seleccionar cliente"
              value={clientSearchTerm}
              onChange={(e) => {
                setClientSearchTerm(e.target.value);
                setSelectedClient(''); // Deselect client if typing
              }}
            />
            {filteredClients.length > 0 && clientSearchTerm.length > 1 && (
              <ul className="pos-search-results">
                {filteredClients.map(client => (
                  <li key={client.id} onClick={() => handleClientSelect(client.id)}>
                    {client.nombre} ({client.email})
                  </li>
                ))}
              </ul>
            )}
            {selectedClient && (
              <p className="pos-selected-info">
                Cliente Seleccionado: <strong>{clients.find(c => c.id === selectedClient)?.nombre}</strong>
              </p>
            )}
            {!selectedClient && ( // Option for "Consumidor Final" or similar
              <button
                className="pos-quick-select-btn"
                onClick={() => handleClientSelect(clients.find(c => c.nombre.toLowerCase() === 'consumidor final')?.id || clients[0]?.id)} // Try to find "Consumidor Final" or use first client as fallback
              >
                Consumidor Final
              </button>
            )}
          </div>

          <div className="pos-section product-search-section">
            <label htmlFor="product-search" className="pos-label">
              Buscar Producto:
            </label>
            <input
              ref={productSearchInputRef}
              type="text"
              id="product-search"
              className="form-input pos-input"
              placeholder="Referencia o Nombre del Producto"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length > 0) {
                  addProductToSale(filteredProducts[0]); // Add the first filtered product on Enter
                }
              }}
            />
            {filteredProducts.length > 0 && productSearchTerm.length > 1 && (
              <ul className="pos-search-results product-results">
                {filteredProducts.map(product => (
                  <li key={product.referencia_producto} onClick={() => addProductToSale(product)}>
                    {product.nombre} (Ref: {product.referencia_producto}) - Stock: {product.stock}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Sale Items, Total, Payment, Actions */}
        <div className="pos-right-column">
          <div className="pos-section sale-items-section">
            <h3 className="section-title">Detalle de Venta</h3>
            {saleItems.length === 0 ? (
              <p className="empty-state">Agrega productos para iniciar la venta.</p>
            ) : (
              <ul className="sale-items-list">
                {saleItems.map(item => (
                  <li key={item.product_obj.referencia_producto} className="sale-item">
                    <div className="item-details">
                      <span className="item-name">{item.product_obj.nombre}</span>
                      <span className="item-price"> ${item.product_obj.precio_costo} x {item.quantity}</span>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => adjustItemQuantity(item.product_obj.referencia_producto, -1)} className="quantity-btn">-</button>
                      <span className="item-quantity">{item.quantity}</span>
                      <button onClick={() => adjustItemQuantity(item.product_obj.referencia_producto, 1)} className="quantity-btn">+</button>
                      <span className="item-subtotal">Total: ${item.subtotal_item.toFixed(2)}</span>
                      <button onClick={() => removeItemFromSale(item.product_obj.referencia_producto)} className="remove-item-btn">
                        <span role="img" aria-label="remove">🗑️</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pos-section summary-section">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span className="summary-value">${totalAmount.toFixed(2)}</span>
            </div>
            {/* You could add tax, discount lines here if applicable */}
            <div className="summary-line total-line">
              <span>Total:</span>
              <span className="summary-value">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="pos-section payment-section">
            <label htmlFor="payment-method" className="pos-label">
              Forma de Pago: <span className="required-field">*</span>
            </label>
            <select
              id="payment-method"
              className="form-select pos-select"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              required
            >
              <option value="">-- Selecciona --</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>{method.metodo}</option>
              ))}
            </select>
          </div>

          <div className="pos-actions">
            <button onClick={clearSale} className="pos-action-btn cancel-btn" disabled={submittingSale}>
              <span role="img" aria-label="cancel">🗑️</span> Cancelar Venta
            </button>
            <button onClick={processSale} className="pos-action-btn process-btn" disabled={submittingSale || saleItems.length === 0 || !selectedClient || !selectedPaymentMethod}>
              {submittingSale ? (
                <>
                  <span role="img" aria-label="processing">⚙️</span> Procesando...
                </>
              ) : (
                <>
                  <span role="img" aria-label="process">💰</span> Procesar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPage;