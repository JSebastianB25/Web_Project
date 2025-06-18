import React, { useState, useEffect } from 'react'; // Eliminamos 'useContext' de aquí
import { Form, Button, Alert, Container, Row, Col, Card } from 'react-bootstrap';
// --- CAMBIO AQUÍ: Importamos 'useAuth' en lugar de 'AuthContext' ---
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'animate.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // --- CAMBIO AQUÍ: Usamos 'useAuth()' en lugar de 'useContext(AuthContext)' ---
    const { loginUser, authError, user, loading } = useAuth(); 
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await loginUser({ username, password });
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center"
            style={{
                minHeight: '100vh',
                backgroundColor: '#000000'
            }}>
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={4}>
                    <Card style={{ backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                        <Card.Body className="p-5">
                            <h2 className="text-center mb-4" style={{ color: '#00b45c' }}>
                                {loading ? (
                                    <FontAwesomeIcon
                                        icon={faMicrochip}
                                        spin
                                        size="2x"
                                        style={{ color: '#00b45c' }}
                                        className="mb-3"
                                    />
                                ) : (
                                    <FontAwesomeIcon
                                        icon={faMicrochip}
                                        size="2x"
                                        style={{ color: '#00b45c' }}
                                        className="mb-3"
                                    />
                                )}
                                <br />
                                Iniciar Sesión
                            </h2>
                            {authError && (
                                <Alert variant="danger" className="animate__animated animate__shakeX">
                                    {authError}
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicUsername">
                                    <Form.Label style={{ color: '#000000' }}>Usuario</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ingresa tu usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        style={{ borderColor: '#00b45c' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formBasicPassword">
                                    <Form.Label style={{ color: '#000000' }}>Contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ borderColor: '#00b45c' }}
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100"
                                    disabled={loading}
                                    style={{
                                        backgroundColor: '#00b45c',
                                        borderColor: '#00b45c',
                                        color: '#ffffff'
                                    }}
                                >
                                    {loading ? 'Iniciando...' : 'Entrar'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;