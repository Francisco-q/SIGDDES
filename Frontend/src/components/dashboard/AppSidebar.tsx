import {
    Business as BuildingIcon,
    Logout as LogOutIcon,
    Person as ProfileIcon,
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Modal,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const campusUniversitarios = [
    { id: 1, nombre: 'Talca', denuncias: 24 },
    { id: 2, nombre: 'Curico', denuncias: 24 },
    { id: 3, nombre: 'Linares', denuncias: 12 },
    { id: 4, nombre: 'Santiago', denuncias: 8 },
    { id: 5, nombre: 'Pehuenche', denuncias: 15 },
    { id: 6, nombre: 'Colchagua', denuncias: 6 },
];

interface AppSidebarProps {
    onLogout: () => void;
}

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

export default function AppSidebar({ onLogout }: AppSidebarProps) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectCampus = (campus: string) => {
        navigate(`/mapa2/${campus}`);
        if (isSmallScreen) setIsDrawerOpen(false);
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
        if (isSmallScreen) setIsDrawerOpen(false);
    };

    const handleProfile = async () => {
        setIsModalOpen(true);
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            console.log('Haciendo GET a /api/usuario/perfil/ con token:', token);
            const response = await axios.get('http://localhost:8000/api/usuario/perfil/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Datos recibidos:', response.data);
            setUsuario(response.data);
            setError(null);
        } catch (err) {
            console.log('Error en GET:', err);
            setError('Error al cargar los datos del usuario');
        } finally {
            setLoading(false);
        }
        if (isSmallScreen) setIsDrawerOpen(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUsuario(null);
        setError(null);
    };

    const drawerContent = (
        <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
                <ListItemButton component="a" href="#" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.main',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <BuildingIcon sx={{ color: 'white' }} />
                        </Box>
                    </ListItemIcon>
                    <ListItemText primary="Universidad de Talca" secondary="Mapas de campus" />
                </ListItemButton>
            </Box>
            <Divider />
            <List>
                {campusUniversitarios.map((campus) => (
                    <ListItemButton key={campus.id} onClick={() => handleSelectCampus(campus.nombre)}>
                        <ListItemIcon>
                            <BuildingIcon />
                        </ListItemIcon>
                        <ListItemText primary={campus.nombre} />
                    </ListItemButton>
                ))}
            </List>
            <Divider />
            <List>
                <ListItemButton onClick={handleProfile}>
                    <ListItemIcon>
                        <ProfileIcon />
                    </ListItemIcon>
                    <ListItemText primary="Perfil" />
                </ListItemButton>
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <List>
                <ListItemButton onClick={handleLogout}>
                    <ListItemIcon>
                        <LogOutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Cerrar Sesión" />
                </ListItemButton>
            </List>
        </Box>
    );

    return (
        <>
            {isSmallScreen ? (
                <>
                    <IconButton
                        onClick={() => setIsDrawerOpen(true)}
                        sx={{
                            position: 'fixed',
                            top: 16,
                            left: 16,
                            zIndex: 1300,
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Drawer
                        anchor="left"
                        open={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        ModalProps={{
                            keepMounted: true,
                        }}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: 280,
                                boxSizing: 'border-box',
                            },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                </>
            ) : (
                <Drawer
                    anchor="left"
                    variant="permanent"
                    sx={{
                        width: 280,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 280,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}
            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                aria-labelledby="modal-perfil-usuario"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Card sx={{ width: '90%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' }}>
                    <CardHeader
                        title={usuario ? `${usuario.first_name} ${usuario.last_name}` : 'Perfil de Usuario'}
                        subheader="Información del usuario"
                        titleTypographyProps={{ textAlign: 'center' }}
                        subheaderTypographyProps={{ textAlign: 'center' }}
                    />
                    <CardContent>
                        {loading ? (
                            <Typography sx={{ textAlign: 'center' }}>Cargando datos...</Typography>
                        ) : error || !usuario ? (
                            <Typography sx={{ textAlign: 'center' }} color="error">
                                {error || 'No se encontraron datos del usuario'}
                            </Typography>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <Button variant="contained" onClick={handleCloseModal}>
                            Cerrar
                        </Button>
                    </Box>
                </Card>
            </Modal>
        </>
    );
}