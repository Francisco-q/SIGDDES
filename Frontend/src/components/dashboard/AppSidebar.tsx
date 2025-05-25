"use client"

import {
    Dashboard as DashboardIcon,
    Logout as LogOutIcon,
    Map as MapIcon,
    Person as ProfileIcon,
    School as SchoolIcon,
} from "@mui/icons-material"
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    Drawer,
    Fab,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Modal,
    Paper,
    Skeleton,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material"
import axios from "axios"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import "./AppSidebar.css"

const campusUniversitarios = [
    { id: 1, nombre: "Talca", denuncias: 24 },
    { id: 2, nombre: "Curico", denuncias: 24 },
    { id: 3, nombre: "Linares", denuncias: 12 },
    { id: 4, nombre: "Santiago", denuncias: 8 },
    { id: 5, nombre: "Pehuenche", denuncias: 15 },
    { id: 6, nombre: "Colchagua", denuncias: 6 },
]

interface AppSidebarProps {
    onLogout: () => void
}

interface Usuario {
    id: number
    first_name: string
    last_name: string
    email: string
    telefono: string | null
    campus: string | null
    role: string
    date_joined: string
}

export default function AppSidebar({ onLogout }: AppSidebarProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"))
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeItem, setActiveItem] = useState<string>("")

    // Determinar el elemento activo basado en la ruta actual
    useEffect(() => {
        const path = location.pathname
        if (path.includes("/mapa2/")) {
            const campus = path.split("/mapa2/")[1]
            setActiveItem(campus)
        } else if (path.includes("/dashboard")) {
            setActiveItem("dashboard")
        } else {
            setActiveItem("")
        }
    }, [location])

    const handleSelectCampus = (campus: string) => {
        navigate(`/mapa2/${campus}`)
        if (isSmallScreen) setIsDrawerOpen(false)
    }

    const handleLogout = () => {
        onLogout()
        navigate("/login")
        if (isSmallScreen) setIsDrawerOpen(false)
    }

    const handleProfile = async () => {
        setIsModalOpen(true)
        setLoading(true)
        try {
            const token = localStorage.getItem("access_token")
            console.log("Haciendo GET a /api/usuario/perfil/ con token:", token)
            const response = await axios.get("http://localhost:8000/api/usuario/perfil/", {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log("Datos recibidos:", response.data)
            setUsuario(response.data)
            setError(null)
        } catch (err) {
            console.log("Error en GET:", err)
            setError("Error al cargar los datos del usuario")
        } finally {
            setLoading(false)
        }
        if (isSmallScreen) setIsDrawerOpen(false)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setUsuario(null)
        setError(null)
    }

    const handleNavigateToDashboard = () => {
        navigate("/dashboard")
        if (isSmallScreen) setIsDrawerOpen(false)
    }

    const toggleCollapse = () => {
        if (isSmallScreen) {
            setIsDrawerOpen(!isDrawerOpen)
        } else {
            setIsCollapsed(!isCollapsed)
        }
    }

    // Función para obtener las iniciales del nombre
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    const sidebarWidth = isCollapsed ? 80 : 280

    const drawerContent = (
        <Box className="app-sidebar-container" sx={{ width: sidebarWidth }}>
            <Box className={`app-sidebar-header ${isCollapsed ? "collapsed" : "expanded"}`}>
                <Tooltip title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"} placement="right">
                    <Box onClick={toggleCollapse} className={`app-sidebar-logo ${isCollapsed ? "collapsed" : "expanded"}`}>
                        <SchoolIcon className={`app-sidebar-logo-icon ${isCollapsed ? "collapsed" : "expanded"}`} />
                    </Box>
                </Tooltip>
                {!isCollapsed && (
                    <Box className="app-sidebar-header-text">
                        <Typography className="app-sidebar-title">Universidad de Talca</Typography>
                        <Typography className="app-sidebar-subtitle">Sistema de Mapas y Seguridad</Typography>
                    </Box>
                )}
            </Box>

            <Box className={`app-sidebar-section ${isCollapsed ? "collapsed" : "expanded"}`}>
                {!isCollapsed && <Typography className="app-sidebar-section-title">DASHBOARD</Typography>}
                <Paper elevation={0} className="app-sidebar-card">
                    <Tooltip title={isCollapsed ? "Panel Principal" : ""} placement="right">
                        <ListItemButton
                            onClick={handleNavigateToDashboard}
                            selected={activeItem === "dashboard"}
                            className={`app-sidebar-list-button ${isCollapsed ? "collapsed" : "expanded"} ${activeItem === "dashboard" ? "selected" : ""
                                }`}
                        >
                            <ListItemIcon className={`app-sidebar-list-icon ${isCollapsed ? "collapsed" : "expanded"}`}>
                                <DashboardIcon />
                            </ListItemIcon>
                            {!isCollapsed && (
                                <ListItemText
                                    primary="Panel Principal"
                                    primaryTypographyProps={{ fontWeight: activeItem === "dashboard" ? 600 : 400 }}
                                />
                            )}
                        </ListItemButton>
                    </Tooltip>
                </Paper>
            </Box>

            <Box className={`app-sidebar-section ${isCollapsed ? "collapsed" : "expanded"}`}>
                {!isCollapsed && <Typography className="app-sidebar-section-title">CAMPUS</Typography>}
                <Paper elevation={0} className="app-sidebar-card">
                    {campusUniversitarios.map((campus) => (
                        <Tooltip key={campus.id} title={isCollapsed ? campus.nombre : ""} placement="right">
                            <ListItemButton
                                onClick={() => handleSelectCampus(campus.nombre)}
                                selected={activeItem === campus.nombre}
                                className={`app-sidebar-list-button ${isCollapsed ? "collapsed" : "expanded"} ${activeItem === campus.nombre ? "selected" : ""
                                    }`}
                            >
                                <ListItemIcon className={`app-sidebar-list-icon ${isCollapsed ? "collapsed" : "expanded"}`}>
                                    <Badge
                                        badgeContent={isCollapsed ? campus.denuncias : undefined}
                                        color="error"
                                        classes={{ badge: "app-sidebar-badge" }}
                                    >
                                        <MapIcon />
                                    </Badge>
                                </ListItemIcon>
                                {!isCollapsed && (
                                    <>
                                        <ListItemText
                                            primary={campus.nombre}
                                            primaryTypographyProps={{ fontWeight: activeItem === campus.nombre ? 600 : 400 }}
                                        />
                                        <Badge
                                            badgeContent={campus.denuncias}
                                            color="error"
                                            classes={{ badge: "app-sidebar-badge expanded" }}
                                        />
                                    </>
                                )}
                            </ListItemButton>
                        </Tooltip>
                    ))}
                </Paper>
            </Box>

            <Box className="app-sidebar-flex-grow" />

            <Divider className="app-sidebar-divider" />

            <Box className={`app-sidebar-section ${isCollapsed ? "collapsed" : "expanded"}`}>
                <Paper elevation={0} className="app-sidebar-card">
                    <Tooltip title={isCollapsed ? "Mi Perfil" : ""} placement="right">
                        <ListItemButton
                            onClick={handleProfile}
                            className={`app-sidebar-list-button ${isCollapsed ? "collapsed" : "expanded"}`}
                        >
                            <ListItemIcon className={`app-sidebar-list-icon ${isCollapsed ? "collapsed" : "expanded"}`}>
                                <ProfileIcon />
                            </ListItemIcon>
                            {!isCollapsed && <ListItemText primary="Mi Perfil" />}
                        </ListItemButton>
                    </Tooltip>
                </Paper>

                <Tooltip title={isCollapsed ? "Cerrar Sesión" : ""} placement="right">
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={!isCollapsed ? <LogOutIcon /> : undefined}
                        onClick={handleLogout}
                        className={`app-sidebar-logout-button ${isCollapsed ? "collapsed" : "expanded"}`}
                    >
                        {isCollapsed ? <LogOutIcon /> : "Cerrar Sesión"}
                    </Button>
                </Tooltip>
            </Box>
        </Box>
    )

    return (
        <>
            <Drawer
                anchor="left"
                open={isSmallScreen ? isDrawerOpen : true}
                onClose={() => isSmallScreen && setIsDrawerOpen(false)}
                variant={isSmallScreen ? "temporary" : "permanent"}
                ModalProps={isSmallScreen ? { keepMounted: true } : undefined}
                classes={{
                    paper: "app-sidebar-drawer",
                }}
                BackdropProps={
                    isSmallScreen
                        ? {
                            className: "app-sidebar-drawer-backdrop",
                        }
                        : undefined
                }
                sx={{
                    width: sidebarWidth,
                    flexShrink: 0,
                    transition: "width 0.3s ease",
                    "& .MuiDrawer-paper": {
                        width: sidebarWidth,
                        boxSizing: "border-box",
                        boxShadow: "4px 0 10px rgba(0, 0, 0, 0.05)",
                        border: "none",
                        transition: "width 0.3s ease",
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Botón flotante para móvil - Renderizado en el body usando portal */}
            {isSmallScreen && !isDrawerOpen && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 20,
                        left: 20,
                        zIndex: 9999,
                        pointerEvents: "auto",
                    }}
                >
                    <Tooltip title="Abrir menú" placement="bottom">
                        <Fab
                            onClick={() => setIsDrawerOpen(true)}
                            sx={{
                                backgroundColor: "#6200ea",
                                color: "white",
                                boxShadow: "0 6px 20px rgba(98, 0, 234, 0.3)",
                                "&:hover": {
                                    backgroundColor: "#5000d3",
                                    boxShadow: "0 8px 25px rgba(98, 0, 234, 0.4)",
                                    transform: "scale(1.1)",
                                },
                                "&:active": {
                                    transform: "scale(0.95)",
                                },
                                transition: "all 0.3s ease",
                            }}
                            size="medium"
                            aria-label="Abrir menú de navegación"
                        >
                            <SchoolIcon sx={{ fontSize: 28 }} />
                        </Fab>
                    </Tooltip>
                </Box>
            )}

            <Modal open={isModalOpen} onClose={handleCloseModal} className="app-sidebar-modal">
                <Card className="app-sidebar-modal-card">
                    <CardHeader
                        avatar={
                            usuario ? (
                                <Avatar className="app-sidebar-avatar">
                                    {getInitials(`${usuario.first_name} ${usuario.last_name}`)}
                                </Avatar>
                            ) : (
                                <Skeleton variant="circular" width={60} height={60} />
                            )
                        }
                        title={usuario ? `${usuario.first_name} ${usuario.last_name}` : "Perfil de Usuario"}
                        subheader={usuario ? usuario.role : "Información del usuario"}
                        titleTypographyProps={{ className: "app-sidebar-modal-title" }}
                        className="app-sidebar-modal-header"
                    />
                    <CardContent className="app-sidebar-modal-content">
                        {loading ? (
                            <Box className="app-sidebar-skeleton-container">
                                <Skeleton variant="rectangular" height={40} />
                                <Skeleton variant="rectangular" height={40} />
                                <Skeleton variant="rectangular" height={40} />
                                <Skeleton variant="rectangular" height={40} />
                            </Box>
                        ) : error || !usuario ? (
                            <Box className="app-sidebar-modal-error">
                                <Typography color="error" variant="h6" sx={{ mb: 1 }}>
                                    Error al cargar datos
                                </Typography>
                                <Typography color="error" variant="body2">
                                    {error || "No se encontraron datos del usuario"}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <Box className="app-sidebar-modal-field">
                                    <Typography className="app-sidebar-modal-field-label">Correo Electrónico</Typography>
                                    <Typography className="app-sidebar-modal-field-value">{usuario.email}</Typography>
                                </Box>

                                <Box className="app-sidebar-modal-field">
                                    <Typography className="app-sidebar-modal-field-label">Teléfono</Typography>
                                    <Typography className="app-sidebar-modal-field-value">
                                        {usuario.telefono || "No especificado"}
                                    </Typography>
                                </Box>

                                <Box className="app-sidebar-modal-field">
                                    <Typography className="app-sidebar-modal-field-label">Rol</Typography>
                                    <Chip label={usuario.role} color="primary" className="app-sidebar-modal-chip" />
                                </Box>

                                {usuario.campus && (
                                    <Box className="app-sidebar-modal-field">
                                        <Typography className="app-sidebar-modal-field-label">Campus</Typography>
                                        <Typography className="app-sidebar-modal-field-value">{usuario.campus}</Typography>
                                    </Box>
                                )}

                                <Box className="app-sidebar-modal-field">
                                    <Typography className="app-sidebar-modal-field-label">Fecha de Registro</Typography>
                                    <Typography className="app-sidebar-modal-field-value">
                                        {format(new Date(usuario.date_joined), "dd/MM/yyyy", { locale: es })}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                    <Box className="app-sidebar-modal-footer">
                        <Button variant="contained" onClick={handleCloseModal} className="app-sidebar-modal-close-button">
                            Cerrar
                        </Button>
                    </Box>
                </Card>
            </Modal>
        </>
    )
}
