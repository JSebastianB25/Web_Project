import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // Asumo que tienes SweetAlert2 instalado como en tu ejemplo

const ClienteAdd = () => {
    // 1. Estado para los datos del formulario
    const [clienteData, setClienteData] = useState({
        nombre: '',
        telefono: '',
        email: '',
    });

    // Estado para manejar si hay un proceso de carga o un error general
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 2. Manejador de cambios para los campos del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setClienteData({
            ...clienteData,
            [name]: value,
        });
    };

    // 3. Manejador del envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario

        setLoading(true);
        setError(null);

        try {
            // Asegúrate de que esta URL coincida con tu endpoint de API para clientes
            // Normalmente sería algo como /api/clientes/ o /api/clients/
            const response = await axios.post('http://localhost:8000/api/clientes/', clienteData);

            if (response.status === 201) { // 201 Created es el código de éxito para POST
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Cliente agregado exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
                // Limpiar el formulario después del éxito
                setClienteData({
                    nombre: '',
                    telefono: '',
                    email: '',
                });
            }
        } catch (err) {
            console.error('Error al agregar cliente:', err);
            setError(err); // Guarda el error completo para depuración si es necesario

            let errorMessage = 'Error al agregar el cliente. Por favor, inténtalo de nuevo.';
            if (err.response && err.response.data) {
                // Manejo de errores de validación de Django REST Framework
                const data = err.response.data;
                if (data.email && data.email.includes('cliente with this email address already exists.')) {
                    errorMessage = 'Ya existe un cliente con esta dirección de correo electrónico.';
                } else {
                    // Si hay otros errores de validación, puedes mostrarlos
                    errorMessage = Object.values(data).flat().join(' ');
                }
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Agregar Nuevo Cliente</h2>
            <hr />
            <form onSubmit={handleSubmit}>
                {/* Campo Nombre */}
                <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">Nombre</label>
                    <input
                        type="text"
                        className="form-control"
                        id="nombre"
                        name="nombre"
                        value={clienteData.nombre}
                        onChange={handleChange}
                        required // El nombre es obligatorio según tu modelo
                    />
                </div>

                {/* Campo Teléfono */}
                <div className="mb-3">
                    <label htmlFor="telefono" className="form-label">Teléfono</label>
                    <input
                        type="tel" // Tipo 'tel' para mejor semántica en el navegador
                        className="form-control"
                        id="telefono"
                        name="telefono"
                        value={clienteData.telefono}
                        onChange={handleChange}
                        // blank=True en el modelo, así que no es 'required' aquí
                    />
                </div>

                {/* Campo Email */}
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email" // Tipo 'email' para validación básica del navegador
                        className="form-control"
                        id="email"
                        name="email"
                        value={clienteData.email}
                        onChange={handleChange}
                        required // Email es obligatorio y único
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
            </form>
        </div>
    );
};

export default ClienteAdd;