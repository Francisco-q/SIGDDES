import {
    Dashboard as DashboardIcon,
    Logout as LogOutIcon,
    Map as MapIcon,
    Person as ProfileIcon,
    School as SchoolIcon,
} from "@mui/icons-material"
import MenuIcon from "@mui/icons-material/Menu"
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
    IconButton,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Modal,
    Paper,
    Skeleton,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material"
import axios from "axios"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const campusUniversitarios = [
    { id: 1, nombre: "Talca" },
    { id: 2, nombre: "Curico" },
    { id: 3, nombre: "Linares" },
    { id: 4, nombre: "Santiago" },
    { id: 5, nombre: "Pehuenche" },
    { id: 6, nombre: "Colchagua" },
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
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"))
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
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

    // Función para obtener las iniciales del nombre
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    const drawerContent = (
        <Box
            sx={{
                width: 280,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f9f5ff",
            }}
        >
            <Box
                sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#6200ea",
                    color: "white",
                }}
            >
                <Box
                    sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        mb: 2,
                    }}
                >
                    <SchoolIcon sx={{ color: "#6200ea", fontSize: 32 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center" }}>
                    Universidad de Talca
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, textAlign: "center" }}>
                    Sistema de Mapas y Seguridad
                </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ pl: 2, mb: 1, color: "#6200ea", fontWeight: 600 }}>
                    DASHBOARD
                </Typography>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        mb: 2,
                        backgroundColor: "white",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <ListItemButton
                        onClick={handleNavigateToDashboard}
                        selected={activeItem === "dashboard"}
                        sx={{
                            borderRadius: "12px",
                            mb: 0.5,
                            "&.Mui-selected": {
                                backgroundColor: "rgba(98, 0, 234, 0.08)",
                                "&:hover": {
                                    backgroundColor: "rgba(98, 0, 234, 0.12)",
                                },
                            },
                            "&:hover": {
                                backgroundColor: "rgba(98, 0, 234, 0.04)",
                            },
                        }}
                    >
                        <ListItemIcon>
                            <DashboardIcon sx={{ color: "#6200ea" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Panel Principal"
                            primaryTypographyProps={{ fontWeight: activeItem === "dashboard" ? 600 : 400 }}
                        />
                    </ListItemButton>
                </Paper>
            </Box>

            <Box sx={{ px: 2, pb: 2 }}>
                <Typography variant="subtitle2" sx={{ pl: 2, mb: 1, color: "#6200ea", fontWeight: 600 }}>
                    CAMPUS
                </Typography>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "white",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                >
                    {campusUniversitarios.map((campus) => (
                        <ListItemButton
                            key={campus.id}
                            onClick={() => handleSelectCampus(campus.nombre)}
                            selected={activeItem === campus.nombre}
                            sx={{
                                borderRadius: "12px",
                                mb: 0.5,
                                "&.Mui-selected": {
                                    backgroundColor: "rgba(98, 0, 234, 0.08)",
                                    "&:hover": {
                                        backgroundColor: "rgba(98, 0, 234, 0.12)",
                                    },
                                },
                                "&:hover": {
                                    backgroundColor: "rgba(98, 0, 234, 0.04)",
                                },
                            }}
                        >
                            <ListItemIcon>
                                <MapIcon sx={{ color: "#6200ea" }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={campus.nombre}
                                primaryTypographyProps={{ fontWeight: activeItem === campus.nombre ? 600 : 400 }}
                            />
                            <Badge
                                badgeContent={campus.denuncias}
                                color="error"
                                sx={{
                                    "& .MuiBadge-badge": {
                                        fontSize: "0.7rem",
                                        height: 18,
                                        minWidth: 18,
                                    },
                                }}
                            />
                        </ListItemButton>
                    ))}
                </Paper>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Divider sx={{ mx: 2, my: 1, opacity: 0.6 }} />

            <Box sx={{ p: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "white",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                        mb: 2,
                    }}
                >
                    <ListItemButton
                        onClick={handleProfile}
                        sx={{
                            borderRadius: "12px",
                            "&:hover": {
                                backgroundColor: "rgba(98, 0, 234, 0.04)",
                            },
                        }}
                    >
                        <ListItemIcon>
                            <ProfileIcon sx={{ color: "#6200ea" }} />
                        </ListItemIcon>
                        <ListItemText primary="Mi Perfil" />
                    </ListItemButton>
                </Paper>

                <Button
                    variant="contained"
                    fullWidth
                    startIcon={<LogOutIcon />}
                    onClick={handleLogout}
                    sx={{
                        backgroundColor: "#6200ea",
                        color: "white",
                        borderRadius: "12px",
                        py: 1,
                        textTransform: "none",
                        boxShadow: "0 4px 12px rgba(98, 0, 234, 0.2)",
                        "&:hover": {
                            backgroundColor: "#5000d3",
                            boxShadow: "0 6px 16px rgba(98, 0, 234, 0.3)",
                        },
                    }}
                >
                    Cerrar Sesión
                </Button>
            </Box>
        </Box>
    )

    return (
        <>
            {isSmallScreen ? (
                <>
                    <IconButton
                        onClick={() => setIsDrawerOpen(true)}
                        sx={{
                            position: "fixed",
                            top: 16,
                            left: 16,
                            zIndex: 1300,
                            bgcolor: "#6200ea",
                            color: "white",
                            boxShadow: "0 4px 12px rgba(98, 0, 234, 0.2)",
                            "&:hover": { bgcolor: "#5000d3", boxShadow: "0 6px 16px rgba(98, 0, 234, 0.3)" },
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
                            "& .MuiDrawer-paper": {
                                width: 280,
                                boxSizing: "border-box",
                                boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
                            },
                            "& .MuiBackdrop-root": {
                                backgroundColor: "rgba(0, 0, 0, 0.3)",
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
                        "& .MuiDrawer-paper": {
                            width: 280,
                            boxSizing: "border-box",
                            boxShadow: "4px 0 10px rgba(0, 0, 0, 0.05)",
                            border: "none",
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
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(3px)",
                }}
            >
                <Card
                    sx={{
                        width: "90%",
                        maxWidth: 500,
                        maxHeight: "80vh",
                        overflowY: "auto",
                        borderRadius: "16px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                    }}
                >
                    <CardHeader
                        avatar={
                            usuario ? (
                                <Avatar sx={{ bgcolor: "#6200ea", width: 60, height: 60 }}>
                                    {getInitials(`${usuario.first_name} ${usuario.last_name}`)}
                                </Avatar>
                            ) : (
                                <Skeleton variant="circular" width={60} height={60} />
                            )
                        }
                        title={usuario ? `${usuario.first_name} ${usuario.last_name}` : "Perfil de Usuario"}
                        subheader={usuario ? usuario.role : "Información del usuario"}
                        titleTypographyProps={{ variant: "h5", fontWeight: 600, color: "#6200ea" }}
                        subheaderTypographyProps={{ variant: "subtitle1" }}
                        sx={{ pb: 1, borderBottom: "1px solid #f0f0f0" }}
                    />
                    <CardContent sx={{ p: 3 }}>
                        {loading ? (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Skeleton variant="rectangular" height={40} />
                                <Skeleton variant="rectangular" height={40} />
                                <Skeleton variant="rectangular" height={40} />
                                <Skeleton variant="rectangular" height={40} />
                            </Box>
                        ) : error || !usuario ? (
                            <Box
                                sx={{
                                    textAlign: "center",
                                    p: 3,
                                    backgroundColor: "#ffebee",
                                    borderRadius: "12px",
                                }}
                            >
                                <Typography color="error" variant="h6" sx={{ mb: 1 }}>
                                    Error al cargar datos
                                </Typography>
                                <Typography color="error" variant="body2">
                                    {error || "No se encontraron datos del usuario"}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        p: 2,
                                        backgroundColor: "#f9f5ff",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Correo Electrónico
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.email}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        p: 2,
                                        backgroundColor: "#f9f5ff",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Teléfono
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.telefono || "No especificado"}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        p: 2,
                                        backgroundColor: "#f9f5ff",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Rol
                                    </Typography>
                                    <Chip
                                        label={usuario.role}
                                        color="primary"
                                        sx={{
                                            alignSelf: "flex-start",
                                            backgroundColor: "#6200ea",
                                            fontWeight: 500,
                                        }}
                                    />
                                </Box>

                                {usuario.campus && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            p: 2,
                                            backgroundColor: "#f9f5ff",
                                            borderRadius: "12px",
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                                            Campus
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {usuario.campus}
                                        </Typography>
                                    </Box>
                                )}

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        p: 2,
                                        backgroundColor: "#f9f5ff",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Fecha de Registro
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {format(new Date(usuario.date_joined), "dd/MM/yyyy", { locale: es })}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                    <Box sx={{ display: "flex", justifyContent: "center", p: 3, borderTop: "1px solid #f0f0f0" }}>
                        <Button
                            variant="contained"
                            onClick={handleCloseModal}
                            sx={{
                                backgroundColor: "#6200ea",
                                color: "white",
                                borderRadius: "12px",
                                px: 4,
                                py: 1,
                                textTransform: "none",
                                fontWeight: 500,
                                boxShadow: "0 4px 12px rgba(98, 0, 234, 0.2)",
                                "&:hover": {
                                    backgroundColor: "#5000d3",
                                    boxShadow: "0 6px 16px rgba(98, 0, 234, 0.3)",
                                },
                            }}
                        >
                            Cerrar
                        </Button>
                    </Box>
                </Card>
            </Modal>
        </>
    )
}
