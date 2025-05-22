// src/pages/AgregarProductoPage.js
import React, { useState, useEffect } from 'react';

const AgregarProductoPage = () => {
  const [newProduct, setNewProduct] = useState({
    referencia_producto: '',
    nombre: '',
    descripcion: '',
    precio_costo: '',
    stock: '',
    proveedor: '',
    categoria: '',
    imagen: '',
    activo: true,
  });

  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const proveedoresResponse = await fetch('http://localhost:8000/api/proveedores/');
        if (!proveedoresResponse.ok) throw new Error(`Error al cargar proveedores: ${proveedoresResponse.status}`);
        const proveedoresData = await proveedoresResponse.json();
        setProveedores(proveedoresData);

        const categoriasResponse = await fetch('http://localhost:8000/api/categorias/');
        if (!categoriasResponse.ok) throw new Error(`Error al cargar categorías: ${categoriasResponse.status}`);
        const categoriasData = await categoriasResponse.json();
        setCategorias(categoriasData);

      } catch (err) {
        console.error("Error al cargar dependencias:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDependencies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProduct(prevProduct => ({
      ...prevProduct,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!newProduct.referencia_producto || !newProduct.nombre || newProduct.precio_costo === '' || newProduct.stock === '' || !newProduct.proveedor || !newProduct.categoria) {
      setError({ message: 'Por favor, completa todos los campos obligatorios.' });
      setSubmitting(false);
      return;
    }

    const productToSend = {
      ...newProduct,
      // Ensure numeric values are actually numbers, even if input type="number"
      precio_costo: parseFloat(newProduct.precio_costo),
      stock: parseInt(newProduct.stock, 10),
    };

    try {
      const response = await fetch('http://localhost:8000/api/productos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN` // Uncomment if needed
        },
        body: JSON.stringify(productToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.referencia_producto ? `Referencia de producto ya existe: ${errorData.referencia_producto[0]}` : `Error al agregar producto: ${JSON.stringify(errorData)}`;
        throw new Error(errorMessage);
      }

      const addedProduct = await response.json();
      setSuccessMessage(`Producto "${addedProduct.nombre}" agregado exitosamente.`);

      // Reset the form after successful submission
      setNewProduct({
        referencia_producto: '',
        nombre: '',
        descripcion: '',
        precio_costo: '',
        stock: '',
        proveedor: '',
        categoria: '',
        imagen: '',
        activo: true,
      });

    } catch (err) {
      console.error("Error adding product:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={styles.container}>
        <div style={styles.loadingMessage}>
          <span role="img" aria-label="loading">⏳</span> Cargando proveedores y categorías...
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={styles.container}>
      <h2 style={styles.heading}>➕ Nuevo Artículo al Inventario</h2>

      {successMessage && (
        <div style={styles.successMessage}>
          <span role="img" aria-label="success">✅</span> {successMessage}
        </div>
      )}
      {error && error.message && (
        <div style={styles.errorMessage}>
          <span role="img" aria-label="error">❌</span> {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          {/* Columna 1: Campos principales */}
          <div style={styles.column}>
            <div style={styles.formGroup}>
              <label htmlFor="referencia_producto" style={styles.label}>
                Referencia: <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="referencia_producto"
                name="referencia_producto"
                value={newProduct.referencia_producto}
                onChange={handleInputChange}
                required
                style={styles.input}
                placeholder="Código único"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="nombre" style={styles.label}>
                Nombre: <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={newProduct.nombre}
                onChange={handleInputChange}
                required
                style={styles.input}
                placeholder="Nombre del producto"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="precio_costo" style={styles.label}>
                Precio Costo: <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="precio_costo"
                name="precio_costo"
                value={newProduct.precio_costo}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                style={styles.input}
                placeholder="0.00"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="stock" style={styles.label}>
                Stock Inicial: <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={newProduct.stock}
                onChange={handleInputChange}
                min="0"
                required
                style={styles.input}
                placeholder="0"
              />
            </div>
          </div>

          {/* Columna 2: Detalles y Foreign Keys */}
          <div style={styles.column}>
            <div style={styles.formGroup}>
              <label htmlFor="proveedor" style={styles.label}>
                Proveedor: <span style={styles.required}>*</span>
              </label>
              <select
                id="proveedor"
                name="proveedor"
                value={newProduct.proveedor}
                onChange={handleInputChange}
                required
                style={styles.select}
              >
                <option value="">-- Selecciona --</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="categoria" style={styles.label}>
                Categoría: <span style={styles.required}>*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={newProduct.categoria}
                onChange={handleInputChange}
                required
                style={styles.select}
              >
                <option value="">-- Selecciona --</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="imagen" style={styles.label}>
                URL Imagen (opcional):
              </label>
              <input
                type="text"
                id="imagen"
                name="imagen"
                value={newProduct.imagen}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enlace a la imagen"
              />
            </div>
            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={newProduct.activo}
                onChange={handleInputChange}
                style={styles.checkbox}
              />
              <label htmlFor="activo" style={styles.labelCheckbox}>
                Producto Activo
              </label>
            </div>
          </div>
        </div>

        {/* Descripción en su propia sección, debajo de las columnas */}
        <div style={styles.descriptionSection}>
          <div style={styles.formGroupFullWidth}>
            <label htmlFor="descripcion" style={styles.label}>
              Descripción:
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={newProduct.descripcion}
              onChange={handleInputChange}
              rows="3" // Keep rows low for compactness
              style={styles.textarea}
              placeholder="Detalles, características..."
            ></textarea>
          </div>
        </div>

        {/* Botón de envío - siempre visible al final */}
        <div style={styles.buttonContainer}>
          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? (
              <>
                <span role="img" aria-label="loading">🔄</span> Agregando...
              </>
            ) : (
              <>
                <span role="img" aria-label="add">➕</span> Agregar Producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Styles for a POS-like, no-scroll view ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 40px)', // Occupy full viewport height minus some margin
    padding: '20px',
    margin: '20px auto', // Smaller margin to maximize vertical space
    maxWidth: '900px', // Wider to accommodate side-by-side columns
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    color: '#333',
    overflow: 'hidden', // Crucial: prevent scroll on the container itself
  },
  heading: {
    fontSize: '2em', // Slightly smaller to save vertical space
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '10px', // Reduced margin
    fontWeight: '600',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px',
  },
  form: {
    flexGrow: 1, // Allow form to take available space
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', // Push button to bottom, fields to top
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Two equal columns
    gap: '15px 25px', // Reduced gaps for compactness
    marginBottom: '15px', // Space between grid and description
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px', // Gap between items within each column
  },
  formGroup: {
    marginBottom: '0',
  },
  formGroupFullWidth: {
    gridColumn: 'span 2',
    marginBottom: '0',
  },
  label: {
    display: 'block',
    marginBottom: '5px', // Reduced label margin
    fontWeight: '600',
    color: '#444',
    fontSize: '0.9em', // Slightly smaller font
  },
  required: {
    color: '#e74c3c',
    fontSize: '1em',
    marginLeft: '5px',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px', // Reduced padding
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '0.95em',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  textarea: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '0.95em',
    minHeight: '60px', // Reduced min-height
    maxHeight: '90px', // Max height to prevent excessive growth
    resize: 'vertical',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '0.95em',
    backgroundColor: '#fff',
    cursor: 'pointer',
    appearance: 'none',
    background: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 20 20\' fill=\'%23555\'%3E%3Cpath d=\'M7 10l5 5 5-5H7z\'/%3E%3C/svg%3E") no-repeat right 10px center',
    backgroundSize: '12px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '5px', // Align with other form elements
  },
  checkbox: {
    marginRight: '8px',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  labelCheckbox: {
    marginBottom: '0',
    fontWeight: 'normal',
    color: '#333',
    cursor: 'pointer',
    fontSize: '0.95em',
  },
  descriptionSection: {
    // This section is outside the main grid but inside the form
    marginBottom: '20px', // Space before the button
  },
  buttonContainer: {
    textAlign: 'center',
    paddingTop: '10px', // Space from description to button
  },
  submitButton: {
    padding: '12px 25px', // Slightly smaller button
    fontSize: '1em',
    fontWeight: '600',
    backgroundColor: '#28a745', // POS-like green for "add"
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)',
  },
  loadingMessage: {
    textAlign: 'center',
    fontSize: '1.2em',
    color: '#555',
    padding: '20px',
    borderRadius: '8px',
    backgroundColor: '#ecf0f1',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  successMessage: {
    backgroundColor: '#e6ffe6',
    color: '#28a745',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '1em',
    border: '1px solid #28a745',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 'bold',
  },
  errorMessage: {
    backgroundColor: '#ffe6e6',
    color: '#dc3545',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '1em',
    border: '1px solid #dc3545',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 'bold',
  },
};



export default AgregarProductoPage;