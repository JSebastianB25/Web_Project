// src/pages/POSPage.js
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [saleError, setSaleError] = useState(null); // Use this for displaying errors
  const [saleSuccessMessage, setSaleSuccessMessage] = useState('');
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState(null); // To store info about the last invoice

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

        // Important: Filter products based on 'referencia_producto' being available, as it's the PK
        const validProducts = productsData.filter(p => p.activo && p.stock > 0 && p.referencia_producto);
        console.log("Fetched Products Data (with PK):", validProducts);
        setClients(clientsData);
        setProducts(validProducts);
        setPaymentMethods(paymentMethodsData);

      } catch (err) {
        console.error("Error fetching POS dependencies:", err);
        setFetchError(err);
      } finally {
        setLoadingDependencies(false);
        productSearchInputRef.current?.focus();
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
          client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
          (client.telefono && client.telefono.includes(clientSearchTerm))
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
    console.log("Product selected for adding:", productToAdd);
    // CRUCIAL: Check for 'referencia_producto' as it's the actual primary key
    if (!productToAdd.referencia_producto) {
        console.error("Error: Producto seleccionado no tiene una referencia_producto válida.", productToAdd);
        setSaleError({ message: `No se pudo agregar el producto "${productToAdd.nombre}" porque no tiene una referencia válida.` });
        return;
    }

    // Use 'referencia_producto' for finding existing items and for keys
    const existingItemIndex = saleItems.findIndex(item => item.product_obj.referencia_producto === productToAdd.referencia_producto);

    if (existingItemIndex > -1) {
      const updatedSaleItems = saleItems.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + 1;
          if (newQuantity > productToAdd.stock) {
            setSaleError({ message: `No hay suficiente stock para ${productToAdd.nombre}. Stock disponible: ${productToAdd.stock}` });
            return item;
          }
          return {
            ...item,
            quantity: newQuantity,
            subtotal_item: parseFloat((newQuantity * item.product_obj.precio_costo).toFixed(2))
          };
        }
        return item;
      });
      setSaleItems(updatedSaleItems);
    } else {
      if (productToAdd.stock === 0) {
        setSaleError({ message: `Producto "${productToAdd.nombre}" sin stock.` });
        return;
      }
      setSaleItems([
        ...saleItems,
        {
          product_obj: { ...productToAdd }, // Shallow copy to ensure all properties are there
          quantity: 1,
          subtotal_item: parseFloat(productToAdd.precio_costo)
        }
      ]);
    }
    setProductSearchTerm('');
    setSaleError(null);
    productSearchInputRef.current?.focus();
  };

  // --- Adjust Item Quantity ---
  const adjustItemQuantity = (productRef, delta) => { // Now expects 'referencia_producto'
    setSaleItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.product_obj.referencia_producto === productRef) { // Use 'referencia_producto' for matching
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null;
          }
          if (newQuantity > item.product_obj.stock) {
            setSaleError({ message: `No hay suficiente stock para ${item.product_obj.nombre}. Stock disponible: ${item.product_obj.stock}` });
            return item;
          }
          setSaleError(null);
          return {
            ...item,
            quantity: newQuantity,
            subtotal_item: parseFloat((newQuantity * item.product_obj.precio_costo).toFixed(2))
          };
        }
        return item;
      }).filter(Boolean);

      return updatedItems;
    });
  };

  // --- Remove Item from Sale ---
  const removeItemFromSale = (productRef) => { // Now expects 'referencia_producto'
    setSaleItems(saleItems.filter(item => item.product_obj.referencia_producto !== productRef)); // Use 'referencia_producto' for filtering
    setSaleError(null);
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
    setLastGeneratedInvoice(null);
    productSearchInputRef.current?.focus();
  };

  // --- Process Sale (Submit Factura and DetalleVenta) ---
  const processSale = async () => {
    setSubmittingSale(true);
    setSaleError(null);
    setSaleSuccessMessage('');
    setLastGeneratedInvoice(null);

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
      console.log("Attempting to create Factura with payload:", {
          cliente: selectedClient,
          forma_pago: selectedPaymentMethod,
          total: totalAmount,
          estado: 'completada',
      });
      const facturaResponse = await fetch('http://localhost:8000/api/facturas/', { // Adjust API endpoint if needed
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
        const errorDetail = await facturaResponse.json().catch(() => ({ detail: 'Unknown error or non-JSON response' }));
        console.error("Factura creation error response:", facturaResponse.status, errorDetail);
        throw new Error(`Error al crear factura: ${JSON.stringify(errorDetail.detail || errorDetail)}`);
      }
      const factura = await facturaResponse.json();
      const facturaId = factura.id; // Assuming your Django response provides 'id' as the PK for Factura

      // *** ADDED DEBUGGING ***
      console.log(`Factura creada con ID: ${facturaId}`);
      if (!facturaId) {
          console.error("CRITICAL: facturaId is missing after Factura creation!", factura);
          throw new Error("No se pudo obtener el ID de la factura creada.");
      }
      // **********************

      // 2. Create DetalleVenta for each item
      for (const item of saleItems) {
        // CRUCIAL: Send 'referencia_producto' as the foreign key value for 'producto'
        console.log(`Sending DetalleVenta for product: ${item.product_obj.nombre}, Ref: ${item.product_obj.referencia_producto}`);
        // *** ADDED DEBUGGING ***
        console.log(`DetalleVenta payload for ${item.product_obj.nombre}:`, {
            factura: facturaId,
            producto: item.product_obj.referencia_producto,
            cantidad: item.quantity,
            precio_unitario: item.product_obj.precio_costo,
        });
        // **********************

        if (!item.product_obj.referencia_producto) {
            console.error("Producto sin referencia_producto al enviar a DetalleVenta:", item.product_obj);
            throw new Error(`Producto "${item.product_obj.nombre}" no tiene una referencia de producto válida para enviar.`);
        }

        const detalleVentaResponse = await fetch('http://localhost:8000/api/detalle-ventas/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factura: facturaId,
            producto: item.product_obj.referencia_producto, // <--- THIS IS THE KEY CHANGE
            cantidad: item.quantity,
            precio_unitario: item.product_obj.precio_costo,
          }),
        });

        if (!detalleVentaResponse.ok) {
          const errorDetail = await detalleVentaResponse.json().catch(() => ({ detail: 'Unknown error or non-JSON response' }));
          console.error(`Error al crear detalle de venta para ${item.product_obj.nombre}:`, detalleVentaResponse.status, errorDetail);
          throw new Error(`Error al crear detalle de venta para ${item.product_obj.nombre}: ${JSON.stringify(errorDetail.detail || errorDetail)}`);
        }
      }

      const clientInfo = clients.find(c => c.id === selectedClient);
      const paymentMethodInfo = paymentMethods.find(pm => pm.id === selectedPaymentMethod);

      // Store invoice details for PDF generation
      setLastGeneratedInvoice({
        id: facturaId,
        date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        clientName: clientInfo ? clientInfo.nombre : 'Consumidor Final',
        clientEmail: clientInfo ? clientInfo.email : 'N/A',
        clientPhone: clientInfo ? clientInfo.telefono : 'N/A',
        paymentMethod: paymentMethodInfo ? paymentMethodInfo.metodo : 'N/A',
        items: saleItems.map(item => ({
          name: item.product_obj.nombre,
          ref: item.product_obj.referencia_producto,
          qty: item.quantity,
          unitPrice: item.product_obj.precio_costo,
          subtotal: item.subtotal_item,
        })),
        total: totalAmount,
      });

      setSaleSuccessMessage(`Venta (Factura #${facturaId}) procesada exitosamente!`);
      clearSale();

    } catch (err) {
      console.error("Error processing sale:", err);
      let errorMessage = 'Ocurrió un error desconocido al procesar la venta.';
      if (err.message) {
          try {
              const parsedError = JSON.parse(err.message);
              // Handle potential nested error details from DRF, e.g., {"factura": ["This field is required."]}
              if (parsedError.factura) {
                  errorMessage = `Error en factura: ${parsedError.factura.join(', ')}`;
              } else if (parsedError.producto) { // In case product error comes up again
                  errorMessage = `Error en producto: ${parsedError.producto.join(', ')}`;
              } else {
                  errorMessage = err.message;
              }
          } catch (e) {
              errorMessage = err.message;
          }
      }
      setSaleError({ message: errorMessage });
    } finally {
      setSubmittingSale(false);
    }
  };


  // --- PDF Generation and Sharing Logic ---
  const generateAndSharePDF = (invoiceDetails) => {
    if (!invoiceDetails) {
      alert("No hay detalles de factura para generar el PDF.");
      return;
    }

    const doc = new jsPDF();

    doc.setFont("helvetica");

    // Title
    doc.setFontSize(22);
    doc.text("Factura de Venta", 105, 20, null, null, "center");

    // Company Info (replace with your company details)
    doc.setFontSize(10);
    doc.text("Mi Tienda POS", 14, 30);
    doc.text("Dirección: Calle Ficticia 123", 14, 35);
    doc.text("Teléfono: +57 310 123 4567", 14, 40);
    doc.text("Email: info@mitienda.com", 14, 45);

    // Invoice Details & Client Info
    doc.setFontSize(12);
    doc.text(`Factura No: ${invoiceDetails.id}`, 140, 30);
    doc.text(`Fecha: ${invoiceDetails.date}`, 140, 37);

    doc.setFontSize(10);
    doc.text("Detalles del Cliente:", 14, 55);
    doc.text(`Nombre: ${invoiceDetails.clientName}`, 14, 60);
    if (invoiceDetails.clientEmail && invoiceDetails.clientEmail !== 'N/A') {
        doc.text(`Email: ${invoiceDetails.clientEmail}`, 14, 65);
    }
    if (invoiceDetails.clientPhone && invoiceDetails.clientPhone !== 'N/A') {
        doc.text(`Teléfono: ${invoiceDetails.clientPhone}`, 14, 70);
    }
    doc.text(`Forma de Pago: ${invoiceDetails.paymentMethod}`, 14, 75);

    // Table for Sale Items
    const tableColumn = ["Cant.", "Producto", "Referencia", "P. Unitario", "Subtotal"];
    const tableRows = [];

    invoiceDetails.items.forEach(item => {
      const itemData = [
        item.qty,
        item.name,
        item.ref,
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.subtotal.toFixed(2)}`,
      ];
      tableRows.push(itemData);
    });

    // AutoTable plugin adds the table
    doc.autoTable(tableColumn, tableRows, {
      startY: 85,
      headStyles: { fillColor: [52, 152, 219] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
      didParseCell: function(data) {
        if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const finalY = doc.autoTable.previous.finalY;

    // Totals
    doc.setFontSize(12);
    doc.text(`Total: $${invoiceDetails.total.toFixed(2)}`, 195, finalY + 15, null, null, "right");

    // Thank You message
    doc.setFontSize(10);
    doc.text("¡Gracias por tu compra!", 105, finalY + 30, null, null, "center");

    const filename = `Factura_${invoiceDetails.id}.pdf`;
    doc.save(filename);

    const whatsappMessage = `¡Hola ${invoiceDetails.clientName}! Aquí está tu factura #${invoiceDetails.id} de Mi Tienda POS. Total: $${invoiceDetails.total.toFixed(2)}. Puedes descargarla adjunta.`;
    const whatsappUrl = `https://wa.me/${invoiceDetails.clientPhone || ''}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');

    const emailSubject = `Tu Factura #${invoiceDetails.id} de Mi Tienda POS`;
    const emailBody = `Hola ${invoiceDetails.clientName},\n\nAdjunto encontrarás tu factura #${invoiceDetails.id} por un total de $${invoiceDetails.total.toFixed(2)}.\n\n¡Gracias por tu compra!\n\nSaludos,\nMi Tienda POS`;
    const emailUrl = `mailto:${invoiceDetails.clientEmail || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(emailUrl, '_blank');
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
          {lastGeneratedInvoice && (
            <div className="share-options-container">
              <button
                className="share-btn"
                onClick={() => generateAndSharePDF(lastGeneratedInvoice)}
              >
                <span role="img" aria-label="pdf">📄</span> Generar PDF y Compartir
              </button>
            </div>
          )}
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
                setSelectedClient('');
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
            {!selectedClient && (
              <button
                className="pos-quick-select-btn"
                onClick={() => handleClientSelect(clients.find(c => c.nombre.toLowerCase() === 'consumidor final')?.id || clients[0]?.id)}
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
                  addProductToSale(filteredProducts[0]);
                }
              }}
            />
            {filteredProducts.length > 0 && productSearchTerm.length > 1 && (
              <ul className="pos-search-results product-results">
                {filteredProducts.map(product => (
                  <li key={product.referencia_producto} onClick={() => addProductToSale(product)}> {/* Use referencia_producto as key */}
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
                  <li key={item.product_obj.referencia_producto} className="sale-item"> {/* Use referencia_producto as key */}
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