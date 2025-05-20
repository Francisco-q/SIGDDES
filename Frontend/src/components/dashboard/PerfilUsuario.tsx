import { Box, Button, Card, CardActions, CardContent, CardHeader, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface Usuario {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    telefono: string | null;
    campus: string | null;
    role: string;
    date_joined: string;
}

export default function PerfilUsuario() {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [errors, setErrors] = useState<{ email?: string; telefono?: string }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsuario = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get('http://localhost:8000/api/usuario/perfil/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsuario(response.data);
                setEmail(response.data.email);
                setTelefono(response.data.telefono || '');
                setLoading(false);
            } catch (err) {
                setError('Error al cargar los datos del usuario');
                setLoading(false);
            }
        };
        fetchUsuario();
    }, []);

    const validate = () => {
        const newErrors: { email?: string; telefono?: string } = {};
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Ingrese un correo electrónico válido';
        }
        if (telefono && !/^\+?\d{7,15}$/.test(telefono)) {
            newErrors.telefono = 'Ingrese un número de teléfono válido (7-15 dígitos)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            const token = localStorage.getItem('access_token');
            const updatedData = { email, telefono };
            const response = await axios.patch('http://localhost:8000/api/usuario/perfil/', updatedData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsuario(response.data);
            setIsEditing(false);
        } catch (err) {
            setError('Error al guardar los cambios');
        }
    };

    const handleCancel = () => {
        if (usuario) {
            setEmail(usuario.email);
            setTelefono(usuario.telefono || '');
            setErrors({});
        }
        setIsEditing(false);
    };

    if (loading) {
        return <Typography sx={{ textAlign: 'center' }}>Cargando datos...</Typography>;
    }

    if (error || !usuario) {
        return <Typography sx={{ textAlign: 'center' }} color="error">{error || 'No se encontraron datos del usuario'}</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: '100vh',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box sx={{ mb: 4, textAlign: 'center', width: '100%', maxWidth: 600 }}>
                    <Typography variant="h5">Perfil de Usuario</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Visualiza y edita tu información personal
                    </Typography>
                </Box>

                <Card sx={{ flex: '1 1 100%', minWidth: 300, maxWidth: 600, margin: 'auto' }}>
                    <CardHeader
                        title={`${usuario.first_name} ${usuario.last_name}`}
                        subheader="Información del usuario"
                        titleTypographyProps={{ textAlign: 'center' }}
                        subheaderTypographyProps={{ textAlign: 'center' }}
                    />
                    <CardContent>
                        {isEditing ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Correo Electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    fullWidth
                                    required
                                    error={!!errors.email}
                                    helperText={errors.email}
                                />
                                <TextField
                                    label="Teléfono"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    fullWidth
                                    error={!!errors.telefono}
                                    helperText={errors.telefono || 'Opcional'}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ width: '100%', textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Correo Electrónico
                                    </Typography>
                                    <Typography variant="body2">{usuario.email}</Typography>
                                </Box>
                                <Box sx={{ width: '100%', textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Teléfono
                                    </Typography>
                                    <Typography variant="body2">{usuario.telefono || 'No especificado'}</Typography>
                                </Box>
                                <Box sx={{ width: '100%', textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Rol
                                    </Typography>
                                    <Typography variant="body2">{usuario.role}</Typography>
                                </Box>
                                {usuario.campus && (
                                    <Box sx={{ width: '100%', textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">
                                            Campus
                                        </Typography>
                                        <Typography variant="body2">{usuario.campus}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ width: '100%', textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Fecha de Registro
                                    </Typography>
                                    <Typography variant="body2">
                                        {format(new Date(usuario.date_joined), 'dd/MM/yyyy', { locale: es })}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center' }}>
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleCancel}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleSave}
                                    disabled={!!errors.email || !!errors.telefono}
                                >
                                    Guardar
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setIsEditing(true)}
                            >
                                Editar Perfil
                            </Button>
                        )}
                    </CardActions>
                </Card>
            </Box>
        </Box>
    );
}