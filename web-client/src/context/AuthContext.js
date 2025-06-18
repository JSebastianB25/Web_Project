// src/context/AuthContext.js

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de tener 'jwt-decode' instalado (npm install jwt-decode)
import context from 'react-bootstrap/esm/AccordionContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true); // Se inicia en true para el chequeo inicial
    const [authError, setAuthError] = useState(null); // Nuevo estado para errores de autenticación

    const navigate = useNavigate();

    // Función para obtener los detalles del usuario después de un login/refresh
    const fetchUserDetails = useCallback(async (token) => {
        try {
            const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/me/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = userResponse.data;
            // Asegúrate de que los permisos sean siempre un array
            return { ...userData, permissions: userData.permissions || [] };
        } catch (error) {
            console.error("Error al obtener detalles del usuario:", error);
            // Si hay un error al obtener detalles del usuario, significa que el token no es válido o hay un problema en la API
            return null; 
        }
    }, []);

    const loginUser = useCallback(async (credentials) => {
        setLoading(true);
        setAuthError(null); // Limpiar errores previos al intentar iniciar sesión
        console.log("Valor de REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/token/`, credentials);
            
            const data = response.data;

            if (data.access) {
                const fetchedUser = await fetchUserDetails(data.access);
                if (fetchedUser) {
                    setUser(fetchedUser);
                    setAuthToken(data.access);
                    localStorage.setItem('user', JSON.stringify(fetchedUser));
                    localStorage.setItem('authToken', data.access);
                    navigate('/');
                    return { success: true }; // Indicar éxito
                } else {
                    // Si no se pudieron obtener los detalles del usuario, es un fallo en el login
                    setAuthError("No se pudieron obtener los detalles del usuario. Intenta de nuevo.");
                    return { success: false, error: "Error al obtener detalles del usuario." };
                }
            } else {
                setAuthError("Respuesta inesperada del servidor.");
                return { success: false, error: "Respuesta inesperada del servidor." };
            }
        } catch (error) {
            console.error('Error de inicio de sesión:', error);
            let errorMessage = "Ocurrió un error desconocido al intentar iniciar sesión.";

            if (error.response) {
                // El servidor respondió con un código de estado fuera del rango 2xx
                console.error('Datos de error del servidor:', error.response.data);
                if (error.response.status === 401) {
                    errorMessage = "Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.";
                } else if (error.response.data && typeof error.response.data === 'object') {
                    // Intenta extraer el mensaje de error de la respuesta del servidor
                    // Esto maneja errores como {'detail': 'No active account found with the given credentials'}
                    // o errores de validación de campos específicos si los hubiera.
                    errorMessage = Object.values(error.response.data).join(' ');
                } else {
                    errorMessage = `Error del servidor: ${error.response.status} ${error.response.statusText}`;
                }
            } else if (error.request) {
                // La solicitud fue hecha pero no se recibió respuesta (problemas de red, CORS, URL incorrecta)
                errorMessage = "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet o la dirección del servidor.";
            } else {
                // Algo más sucedió al configurar la solicitud (ej. error en el código JS)
                errorMessage = error.message;
            }
            setAuthError(errorMessage); // Establecer el mensaje de error
            return { success: false, error: errorMessage }; // Indicar fallo
        } finally {
            setLoading(false); // Siempre desactiva loading al finalizar el intento de login
        }
    }, [navigate, fetchUserDetails]);

    const logoutUser = useCallback(() => {
        setAuthToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAuthError(null); // Limpiar cualquier error de autenticación al cerrar sesión
        navigate('/login');
    }, [navigate]);

    const updateToken = useCallback(async () => {
        setLoading(true); // Activa loading al intentar refrescar el token
        try {
            const refresh = localStorage.getItem('refreshToken'); // Asegúrate de guardar el refresh token
            if (!refresh) {
                setLoading(false);
                logoutUser();
                return;
            }

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/token/refresh/`, { refresh });
            const data = response.data;

            if (data.access) {
                const decodedToken = jwtDecode(data.access);
                const fetchedUser = await fetchUserDetails(data.access);

                if (fetchedUser) {
                    setUser(fetchedUser);
                    setAuthToken(data.access);
                    localStorage.setItem('user', JSON.stringify(fetchedUser));
                    localStorage.setItem('authToken', data.access);
                    // Actualizar refresh token si el endpoint de refresh lo devuelve
                    if (data.refresh) {
                        localStorage.setItem('refreshToken', data.refresh);
                    }
                } else {
                    // Si el token de acceso es válido pero no se pueden obtener los detalles del usuario
                    console.error("Token refrescado pero no se pudieron obtener detalles del usuario. Cerrando sesión.");
                    logoutUser();
                }
            } else {
                console.error("No se recibió un token de acceso válido al refrescar.");
                logoutUser();
            }
        } catch (error) {
            console.error('Error al refrescar el token:', error);
            // Si el refresh token falla (expirado, inválido), se considera deslogueado
            logoutUser();
        } finally {
            setLoading(false); // Siempre desactiva loading después del intento de refresh
        }
    }, [logoutUser, fetchUserDetails]);

    // Este useEffect se ejecuta una vez al cargar la aplicación para verificar la sesión
    useEffect(() => {
        if (authToken) {
            const decodedToken = jwtDecode(authToken);
            const tokenExpiration = decodedToken.exp * 1000; // Convertir a milisegundos

            // Si el token ha expirado, intentar refrescarlo
            if (Date.now() >= tokenExpiration) {
                updateToken();
            } else {
                // Si el token es válido, simplemente establece loading a false
                setLoading(false);
            }
        } else {
            // Si no hay token, no hay sesión activa, así que loading es false
            setLoading(false);
        }

        // Configurar un intervalo para refrescar el token periódicamente
        // Refrescar 5 minutos antes de que expire (por ejemplo, si el token dura 10 minutos)
        // O cada X minutos si la duración del token es larga.
        const REFRESH_INTERVAL = 1000 * 60 * 5; // Cada 5 minutos (ajusta según tu token lifespan)
        const interval = setInterval(() => {
            if (authToken) {
                const decodedToken = jwtDecode(authToken);
                const tokenExpiration = decodedToken.exp * 1000; // Convertir a milisegundos
                // Si el token expirará en menos de X segundos, intentar refrescar
                const refreshThreshold = 1000 * 60 * 2; // 2 minutos antes de la expiración real
                if (Date.now() + REFRESH_INTERVAL >= tokenExpiration - refreshThreshold) {
                     updateToken(); // Llama a updateToken para refrescar si está cerca de expirar
                }
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval); // Limpiar el intervalo al desmontar
    }, [authToken, updateToken]);


    const contextData = {
        user,
        authToken,
        loginUser,
        logoutUser,
        loading, // Exponer el estado de carga
        authError, // Exponer el mensaje de error
        updateToken // Asegurarse de que esta función también esté disponible si la necesitas en otros lugares
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <p className="text-center mt-5">Cargando sesión...</p> : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);