import {
    Business as BuildingIcon,
    Logout as LogOutIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    useTheme,
} from '@mui/material';
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

export default function AppSidebar({ onLogout }: AppSidebarProps) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleSelectCampus = (campus: string) => {
        navigate(`/mapa2/${campus}`);
        if (isSmallScreen) setIsDrawerOpen(false);
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
        if (isSmallScreen) setIsDrawerOpen(false);
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
            <List>
                <ListItemButton component="a" href="#">
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Ajustes" />
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
        </>
    );
}