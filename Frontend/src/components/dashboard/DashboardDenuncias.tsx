"use client"

import type React from "react"

import { Description as FileTextIcon, Search as SearchIcon } from "@mui/icons-material"
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    FormControl,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material"
import axios from "axios"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState } from "react"
import TipoBadge from "./TipoBadge"

interface Denuncia {
    id: number
    nombre: string
    apellido: string
    email: string
    telefono: string
    tipo_incidente: string
    fecha_incidente: string
    lugar_incidente: string
    descripcion: string
    created_at: string
    campus: string
}

export default function DashboardDenuncias() {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
    const isTablet = useMediaQuery(theme.breakpoints.down("md"))

    const [campusSeleccionado, setCampusSeleccionado] = useState<string>("todos")
    const [denuncias, setDenuncias] = useState<Denuncia[]>([])
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc") // Estado para ordenamiento
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pageSize, setPageSize] = useState<number>(10)
    const pageSizeOptions = [5, 10, 25, 50]

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("access_token")
                const response = await axios.get("http://localhost:8000/api/denuncias/", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                setDenuncias(response.data)
                setLoading(false)
            } catch (err) {
                setError("Error al cargar los datos")
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Filtrado combinado: por campus, búsqueda y ordenamiento
    const denunciasFiltradas = denuncias
        .filter((denuncia) => {
            const matchesCampus = campusSeleccionado === "todos" || denuncia.campus === campusSeleccionado
            const query = searchQuery.toLowerCase()
            const matchesSearch =
                searchQuery === "" ||
                denuncia.nombre.toLowerCase().includes(query) ||
                denuncia.apellido.toLowerCase().includes(query) ||
                denuncia.tipo_incidente.toLowerCase().includes(query) ||
                denuncia.campus.toLowerCase().includes(query) ||
                denuncia.descripcion.toLowerCase().includes(query)
            return matchesCampus && matchesSearch
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at)
            const dateB = new Date(b.created_at)
            return sortOrder === "desc"
                ? dateB.getTime() - dateA.getTime() // Más reciente primero
                : dateA.getTime() - dateB.getTime() // Más antigua primero
        })

    // Paginación
    const totalPages = Math.ceil(denunciasFiltradas.length / pageSize)
    const paginatedDenuncias = denunciasFiltradas.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page)
    }

    const estadisticas = Object.entries(
        denuncias.reduce(
            (acc, denuncia) => {
                acc[denuncia.tipo_incidente] = (acc[denuncia.tipo_incidente] || 0) + 1
                return acc
            },
            {} as Record<string, number>,
        ),
    ).map(([tipo, cantidad]) => ({ tipo, cantidad }))

    const campusList = Array.from(new Set(denuncias.map((d) => d.campus))).map((nombre, id) => ({
        id: id + 1,
        nombre,
        denuncias: denuncias.filter((d) => d.campus === nombre).length,
    }))

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "#f9f5ff",
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: "12px",
                        textAlign: "center",
                        maxWidth: "400px",
                        width: "90%",
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2, color: "#6200ea" }}>
                        Cargando datos...
                    </Typography>
                    <Box
                        sx={{
                            width: "50px",
                            height: "50px",
                            margin: "0 auto",
                            border: "5px solid #f3f3f3",
                            borderTop: "5px solid #6200ea",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            "@keyframes spin": {
                                "0%": { transform: "rotate(0deg)" },
                                "100%": { transform: "rotate(360deg)" },
                            },
                        }}
                    />
                </Paper>
            </Box>
        )
    }

    if (error) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "#f9f5ff",
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: "12px",
                        textAlign: "center",
                        maxWidth: "400px",
                        width: "90%",
                    }}
                >
                    <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
                        Reintentar
                    </Button>
                </Paper>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                overflow: "hidden",
                width: "100%",
                backgroundColor: "#f9f5ff",
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    height: "100vh",
                    p: { xs: 1, sm: 2, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        width: "100%",
                        justifyContent: "center",
                        mb: 4,
                    }}
                >
                    <Card
                        sx={{
                            flex: "1 1 100%",
                            minWidth: 300,
                            maxWidth: 1400,
                            margin: "auto",
                            borderRadius: "12px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            overflow: "hidden",
                        }}
                    >
                        <CardHeader
                            title="Casos Recientes"
                            subheader="Lista de casos registrados en el sistema"
                            titleTypographyProps={{
                                textAlign: "center",
                                fontWeight: 600,
                                color: "#6200ea",
                                fontSize: { xs: "1.5rem", md: "1.8rem" },
                            }}
                            subheaderTypographyProps={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: { xs: "0.9rem", md: "1rem" },
                            }}
                            sx={{
                                backgroundColor: "#f3eaff",
                                borderBottom: "1px solid #e0e0e0",
                                py: 3,
                            }}
                        />
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", md: "row" },
                                    gap: 3,
                                }}
                            >
                                {/* Columna izquierda: Filtros y lista de denuncias */}
                                <Box sx={{ flex: "1 1 60%", display: "flex", flexDirection: "column" }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: { xs: "column", sm: "row" },
                                            gap: 2,
                                            mb: 3,
                                            justifyContent: "center",
                                            alignItems: { xs: "stretch", sm: "center" },
                                            backgroundColor: "#f9f5ff",
                                            p: 2,
                                            borderRadius: "10px",
                                        }}
                                    >
                                        <TextField
                                            variant="outlined"
                                            size="small"
                                            placeholder="Buscar caso..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "1 1 260px" },
                                                maxWidth: { xs: "100%", sm: 260 },
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "8px",
                                                    backgroundColor: "white",
                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                },
                                            }}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
                                            }}
                                        />
                                        <FormControl
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "1 1 180px" },
                                                minWidth: 180,
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "8px",
                                                    backgroundColor: "white",
                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                },
                                            }}
                                        >
                                            <InputLabel id="campus-select-label" sx={{ color: "text.secondary" }}>
                                                Filtrar por campus
                                            </InputLabel>
                                            <Select
                                                labelId="campus-select-label"
                                                value={campusSeleccionado}
                                                onChange={(e) => setCampusSeleccionado(e.target.value as string)}
                                                label="Filtrar por campus"
                                                size="small"
                                            >
                                                <MenuItem value="todos">Todos los campus</MenuItem>
                                                {campusList.map((campus) => (
                                                    <MenuItem key={campus.id} value={campus.nombre}>
                                                        {campus.nombre}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "1 1 180px" },
                                                minWidth: 180,
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "8px",
                                                    backgroundColor: "white",
                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                },
                                            }}
                                        >
                                            <InputLabel id="sort-select-label" sx={{ color: "text.secondary" }}>
                                                Ordenar por fecha
                                            </InputLabel>
                                            <Select
                                                labelId="sort-select-label"
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                                                label="Ordenar por fecha"
                                                size="small"
                                            >
                                                <MenuItem value="desc">Más reciente primero</MenuItem>
                                                <MenuItem value="asc">Más antigua primero</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "1 1 150px" },
                                                minWidth: 150,
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "8px",
                                                    backgroundColor: "white",
                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "#6200ea",
                                                    },
                                                },
                                            }}
                                        >
                                            <InputLabel id="page-size-select-label" sx={{ color: "text.secondary" }}>
                                                Filas por página
                                            </InputLabel>
                                            <Select
                                                labelId="page-size-select-label"
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value))
                                                    setCurrentPage(1) // Resetear a la primera página al cambiar el tamaño
                                                }}
                                                label="Filas por página"
                                                size="small"
                                            >
                                                {pageSizeOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                                        {paginatedDenuncias.map((denuncia) => (
                                            <Card
                                                key={denuncia.id}
                                                sx={{
                                                    width: "100%",
                                                    p: 1,
                                                    borderRadius: "10px",
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                                    "&:hover": {
                                                        transform: "translateY(-2px)",
                                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                                    },
                                                }}
                                            >
                                                <CardContent>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: { xs: "column", sm: "row" },
                                                            gap: 1,
                                                            alignItems: { xs: "flex-start", sm: "center" },
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <Box sx={{ flex: "1 1 0", minWidth: 100, textAlign: { xs: "left", sm: "center" } }}>
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                                                Fecha
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {format(new Date(denuncia.created_at), "dd/MM/yyyy", { locale: es })}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ flex: "1 1 0", minWidth: 100, textAlign: { xs: "left", sm: "center" } }}>
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                                                Campus
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {denuncia.campus}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ flex: "1 1 0", minWidth: 100, textAlign: { xs: "left", sm: "center" } }}>
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                                                Tipo
                                                            </Typography>
                                                            <TipoBadge tipo={denuncia.tipo_incidente} />
                                                        </Box>
                                                        <Box sx={{ flex: "1 1 0", minWidth: 100, textAlign: { xs: "left", sm: "center" } }}>
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                                                Afectado
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {`${denuncia.nombre} ${denuncia.apellido}`}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {paginatedDenuncias.length === 0 && (
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    textAlign: "center",
                                                    py: 4,
                                                    px: 2,
                                                    backgroundColor: "#f9f5ff",
                                                    borderRadius: "10px",
                                                    width: "100%",
                                                }}
                                            >
                                                <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>
                                                    No hay casos para mostrar
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>

                                    {totalPages > 1 && (
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 3, gap: 1 }}>
                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                Mostrando {Math.min((currentPage - 1) * pageSize + 1, denunciasFiltradas.length)} -{" "}
                                                {Math.min(currentPage * pageSize, denunciasFiltradas.length)} de {denunciasFiltradas.length}{" "}
                                                resultados
                                            </Typography>
                                            <Pagination
                                                count={totalPages}
                                                page={currentPage}
                                                onChange={handlePageChange}
                                                color="primary"
                                                size="small"
                                                sx={{
                                                    "& .MuiPaginationItem-root": {
                                                        color: "#6200ea",
                                                    },
                                                    "& .Mui-selected": {
                                                        backgroundColor: "#6200ea !important",
                                                        color: "white !important",
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                {/* Columna derecha: Estadísticas */}
                                <Box sx={{ flex: "1 1 40%", display: "flex", flexDirection: "column", gap: 3 }}>
                                    <Card
                                        sx={{
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            "&:hover": {
                                                transform: "translateY(-5px)",
                                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                                            },
                                        }}
                                    >
                                        <CardHeader
                                            title="Total Denuncias"
                                            action={
                                                <Box
                                                    sx={{
                                                        backgroundColor: "#f0e6ff",
                                                        borderRadius: "50%",
                                                        width: 40,
                                                        height: 40,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <FileTextIcon sx={{ color: "#6200ea" }} />
                                                </Box>
                                            }
                                            titleTypographyProps={{
                                                variant: "subtitle1",
                                                fontWeight: 600,
                                                color: "#6200ea",
                                            }}
                                            sx={{ pb: 0 }}
                                        />
                                        <CardContent sx={{ textAlign: "center", pt: 1 }}>
                                            <Typography variant="h3" sx={{ fontWeight: 700, color: "#333", mb: 1 }}>
                                                {denuncias.length}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ display: "block" }}>
                                                {denuncias.filter((d) => new Date(d.created_at).getMonth() === new Date().getMonth()).length}{" "}
                                                registradas este mes
                                            </Typography>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        sx={{
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            "&:hover": {
                                                transform: "translateY(-5px)",
                                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                                            },
                                        }}
                                    >
                                        <CardHeader
                                            title="Estadísticas por Tipo"
                                            subheader="Distribución de denuncias según su categoría"
                                            titleTypographyProps={{
                                                variant: "subtitle1",
                                                fontWeight: 600,
                                                color: "#6200ea",
                                            }}
                                            subheaderTypographyProps={{ variant: "caption" }}
                                            sx={{ pb: 1 }}
                                        />
                                        <CardContent>
                                            {estadisticas.map((stat) => (
                                                <Box key={stat.tipo} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                                    <Typography
                                                        sx={{
                                                            width: 120,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        {stat.tipo}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            flexGrow: 1,
                                                            height: 8,
                                                            bgcolor: "grey.200",
                                                            borderRadius: 4,
                                                            overflow: "hidden",
                                                            mx: 2,
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${(stat.cantidad / Math.max(...estadisticas.map((s) => s.cantidad))) * 100}%`,
                                                                height: "100%",
                                                                bgcolor: "#6200ea",
                                                                transition: "width 1s ease-in-out",
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ width: 30, textAlign: "right", fontWeight: 600 }}>
                                                        {stat.cantidad}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                    borderColor: "#6200ea",
                                                    color: "#6200ea",
                                                    "&:hover": {
                                                        borderColor: "#5000d3",
                                                        backgroundColor: "rgba(98, 0, 234, 0.04)",
                                                    },
                                                    borderRadius: "8px",
                                                    textTransform: "none",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Ver informe completo
                                            </Button>
                                        </CardActions>
                                    </Card>

                                    <Card
                                        sx={{
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            "&:hover": {
                                                transform: "translateY(-5px)",
                                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                                            },
                                            display: { xs: "none", lg: "block" },
                                        }}
                                    >
                                        <CardHeader
                                            title="Distribución por Campus"
                                            titleTypographyProps={{
                                                variant: "subtitle1",
                                                fontWeight: 600,
                                                color: "#6200ea",
                                            }}
                                            sx={{ pb: 1 }}
                                        />
                                        <CardContent>
                                            {campusList.map((campus) => (
                                                <Box key={campus.id} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                                    <Typography
                                                        sx={{
                                                            width: 120,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        {campus.nombre}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            flexGrow: 1,
                                                            height: 8,
                                                            bgcolor: "grey.200",
                                                            borderRadius: 4,
                                                            overflow: "hidden",
                                                            mx: 2,
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${(campus.denuncias / Math.max(...campusList.map((c) => c.denuncias))) * 100}%`,
                                                                height: "100%",
                                                                bgcolor: "#9c27b0",
                                                                transition: "width 1s ease-in-out",
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ width: 30, textAlign: "right", fontWeight: 600 }}>
                                                        {campus.denuncias}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Box>
                        </CardContent>
                        <CardActions
                            sx={{
                                justifyContent: "center",
                                pb: 3,
                                pt: 1,
                                backgroundColor: "#f3eaff",
                                borderTop: "1px solid #e0e0e0",
                            }}
                        >
                            <Button
                                variant="contained"
                                size="medium"
                                sx={{
                                    backgroundColor: "#6200ea",
                                    color: "white",
                                    "&:hover": {
                                        backgroundColor: "#5000d3",
                                    },
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    px: 3,
                                    py: 1,
                                }}
                            >
                                Ver todas las denuncias
                            </Button>
                        </CardActions>
                    </Card>
                </Box>
            </Box>
        </Box>
    )
}
