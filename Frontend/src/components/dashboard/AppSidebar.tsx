import {
    Business as BuildingIcon,
    Logout as LogOutIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import {
    Box,
    Divider,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const campusUniversitarios = [
    { id: 1, nombre: 'Talca', denuncias: 24 },
    { id: 2, nombre: 'Curico', denuncias: 24 },
    { id: 3, nombre: 'Linares', denuncias: 12 },
    { id: 4, nombre: 'Santiago', denuncias: 8 },
    { id: 5, nombre: 'Pehuenche', denuncias: 15 },
    { id: 6, nombre: 'Colchagua', denuncias: 6 },
];

export default function AppSidebar() {
    const navigate = useNavigate();

    const handleSelectCampus = (campus: string) => {
        navigate(`/mapa2/${campus}`); // Navega a /mapa2/campus seleccionado
    };

    return (
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
                        <ListItemText primary="Universidad de Talca" secondary="Sistema de Denuncias" />
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
                <Typography variant="subtitle2" sx={{ p: 2 }}>Configuración</Typography>
                <List>
                    <ListItemButton component="a" href="#">
                        <ListItemIcon><SettingsIcon /></ListItemIcon>
                        <ListItemText primary="Ajustes" />
                    </ListItemButton>
                </List>
                <Box sx={{ flexGrow: 1 }} />
                <Divider />
                <List>
                    <ListItemButton component="a" href="#">
                        <ListItemIcon><LogOutIcon /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" />
                    </ListItemButton>
                </List>
            </Box>
        </Drawer>
    );
}