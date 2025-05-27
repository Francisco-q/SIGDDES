"use client"

import { Description as FileTextIcon, Search as SearchIcon } from "@mui/icons-material"
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    FormControl,
    InputLabel,
    MenuItem,
    Modal,
    Button as MuiButton,
    Pagination,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material"
import axios from "axios"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type React from "react"
import { useEffect, useState } from "react"
import "./DashboardDenuncias.css"
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
    estado: 'pendiente' | 'tomada'
    comentarios: string | null
}

export default function DashboardDenuncias() {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
    const isTablet = useMediaQuery(theme.breakpoints.down("md"))
    const isLaptop = useMediaQuery(theme.breakpoints.down("lg"))

    const [campusSeleccionado, setCampusSeleccionado] = useState<string>("todos")
    const [denuncias, setDenuncias] = useState<Denuncia[]>([])
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pageSize, setPageSize] = useState<number>(10)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null)
    const [estadoLocal, setEstadoLocal] = useState<'pendiente' | 'tomada'>('pendiente')
    const [comentariosLocal, setComentariosLocal] = useState<string>('')

    const pageSizeOptions = [5, 10, 25, 50]

    const getResponsiveClass = () => {
        if (isMobile) return "mobile"
        if (isTablet) return "tablet"
        return "desktop"
    }

    const responsiveClass = getResponsiveClass()

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

    useEffect(() => {
        if (selectedDenuncia) {
            setEstadoLocal(selectedDenuncia.estado)
            setComentariosLocal(selectedDenuncia.comentarios || '')
        }
    }, [selectedDenuncia])

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
            return sortOrder === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
        })

    const totalPages = Math.ceil(denunciasFiltradas.length / pageSize)
    const paginatedDenuncias = denunciasFiltradas.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page)
    }

    const handleOpenModal = (denuncia: Denuncia) => {
        setSelectedDenuncia(denuncia)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedDenuncia(null)
    }

    const handleSaveChanges = () => {
        if (selectedDenuncia) {
            handleUpdateDenuncia({ estado: estadoLocal, comentarios: comentariosLocal })
        }
    }

    const handleUpdateDenuncia = async (updatedData: Partial<Denuncia>) => {
        if (!selectedDenuncia) return
        try {
            const token = localStorage.getItem("access_token")
            await axios.patch(`http://localhost:8000/api/denuncias/${selectedDenuncia.id}/`, updatedData, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setDenuncias(denuncias.map(d => d.id === selectedDenuncia.id ? { ...d, ...updatedData } : d))
            handleCloseModal()
        } catch (error) {
            console.error("Error al actualizar la denuncia:", error)
        }
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
            <Box className="dashboard-loading">
                <Paper elevation={3} className="dashboard-loading-card">
                    <Typography variant="h6" className="dashboard-loading-title">
                        Cargando datos...
                    </Typography>
                    <Box className="dashboard-loading-spinner" />
                </Paper>
            </Box>
        )
    }

    if (error) {
        return (
            <Box className="dashboard-error">
                <Paper elevation={3} className="dashboard-error-card">
                    <Typography variant="h6" color="error" className="dashboard-error-title">
                        {error}
                    </Typography>
                    <MuiButton variant="contained" color="primary" onClick={() => window.location.reload()}>
                        Reintentar
                    </MuiButton>
                </Paper>
            </Box>
        )
    }

    return (
        <Box className="dashboard-container">
            <Box className={`dashboard-content ${responsiveClass}`}>
                <Box sx={{ maxWidth: "100%", width: "100%" }}>
                    <Card className="dashboard-main-card">
                        <CardHeader
                            title="Casos Recientes"
                            subheader="Lista de casos registrados en el sistema"
                            titleTypographyProps={{ className: `dashboard-card-title ${responsiveClass}` }}
                            subheaderTypographyProps={{ className: `dashboard-card-subtitle ${responsiveClass}` }}
                            className={`dashboard-card-header ${responsiveClass}`}
                        />
                        <CardContent className={`dashboard-card-content ${responsiveClass}`}>
                            <Box className={`dashboard-left-column ${responsiveClass}`}>
                                <Box className={`dashboard-filters ${responsiveClass}`}>
                                    <TextField
                                        variant="outlined"
                                        size="small"
                                        placeholder="Buscar caso..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`dashboard-filter-field ${responsiveClass}`}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: "1.1rem" }} />,
                                        }}
                                    />
                                    <FormControl className={`dashboard-filter-field ${responsiveClass}`}>
                                        <InputLabel className={`dashboard-filter-label ${responsiveClass}`}>Campus</InputLabel>
                                        <Select
                                            value={campusSeleccionado}
                                            onChange={(e) => setCampusSeleccionado(e.target.value as string)}
                                            label="Campus"
                                            size="small"
                                        >
                                            <MenuItem value="todos">Todos</MenuItem>
                                            {campusList.map((campus) => (
                                                <MenuItem key={campus.id} value={campus.nombre}>
                                                    {campus.nombre}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl className={`dashboard-filter-field ${responsiveClass}`}>
                                        <InputLabel className={`dashboard-filter-label ${responsiveClass}`}>Orden</InputLabel>
                                        <Select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                                            label="Orden"
                                            size="small"
                                        >
                                            <MenuItem value="desc">Reciente</MenuItem>
                                            <MenuItem value="asc">Antigua</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl className={`dashboard-filter-field ${responsiveClass}`}>
                                        <InputLabel className={`dashboard-filter-label ${responsiveClass}`}>Filas</InputLabel>
                                        <Select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value))
                                                setCurrentPage(1)
                                            }}
                                            label="Filas"
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

                                <Box className={`dashboard-denuncias-list ${responsiveClass}`}>
                                    {paginatedDenuncias.map((denuncia) => (
                                        <Card
                                            key={denuncia.id}
                                            className="dashboard-denuncia-card"
                                            onClick={() => handleOpenModal(denuncia)}
                                        >
                                            <CardContent className={`dashboard-denuncia-content ${responsiveClass}`}>
                                                <Box className={`dashboard-denuncia-field ${isMobile ? "" : "centered"}`}>
                                                    <Typography className={`dashboard-denuncia-field-label ${responsiveClass}`}>Fecha</Typography>
                                                    <Typography className={`dashboard-denuncia-field-value ${responsiveClass}`}>
                                                        {format(new Date(denuncia.created_at), "dd/MM/yyyy", { locale: es })}
                                                    </Typography>
                                                </Box>
                                                <Box className={`dashboard-denuncia-field ${isMobile ? "" : "centered"}`}>
                                                    <Typography className={`dashboard-denuncia-field-label ${responsiveClass}`}>Campus</Typography>
                                                    <Typography className={`dashboard-denuncia-field-value ${responsiveClass}`}>
                                                        {denuncia.campus}
                                                    </Typography>
                                                </Box>
                                                <Box className={`dashboard-denuncia-field ${isMobile ? "" : "centered"}`}>
                                                    <Typography className={`dashboard-denuncia-field-label ${responsiveClass}`}>Tipo</Typography>
                                                    <TipoBadge tipo={denuncia.tipo_incidente} size={isMobile ? "small" : "medium"} />
                                                </Box>
                                                <Box className={`dashboard-denuncia-field ${isMobile ? "" : "centered"}`}>
                                                    <Typography className={`dashboard-denuncia-field-label ${responsiveClass}`}>Afectado</Typography>
                                                    <Typography className={`dashboard-denuncia-field-value ${responsiveClass}`}>
                                                        {`${denuncia.nombre} ${denuncia.apellido}`}
                                                    </Typography>
                                                </Box>
                                                <Box className={`dashboard-denuncia-field ${isMobile ? "" : "centered"}`}>
                                                    <Typography className={`dashboard-denuncia-field-label ${responsiveClass}`}>Estado</Typography>
                                                    <Typography className={`dashboard-denuncia-field-value ${responsiveClass}`}>
                                                        {denuncia.estado === 'tomada' ? 'Tomada' : 'Pendiente'}
                                                    </Typography>
                                                </Box>
                                                <Box className={`dashboard-denuncia-field ${isMobile ? "" : "centered"}`}>
                                                    <Typography className={`dashboard-denuncia-field-label ${responsiveClass}`}>Comentarios</Typography>
                                                    <Typography className={`dashboard-denuncia-field-value ${responsiveClass}`}>
                                                        {denuncia.comentarios || 'Sin comentarios'}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {paginatedDenuncias.length === 0 && (
                                        <Paper elevation={0} className={`dashboard-no-data ${responsiveClass}`}>
                                            <Typography className="dashboard-no-data-text">No hay casos para mostrar</Typography>
                                        </Paper>
                                    )}
                                </Box>

                                {totalPages > 1 && (
                                    <Box className="dashboard-pagination">
                                        <Typography className={`dashboard-pagination-info ${responsiveClass}`}>
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
                                            className="dashboard-pagination"
                                        />
                                    </Box>
                                )}
                            </Box>

                            <Box className={`dashboard-right-column ${responsiveClass}`}>
                                <Card className="dashboard-stats-card">
                                    <CardHeader
                                        title="Total Casos"
                                        action={
                                            <Box className={`dashboard-stats-icon-container ${responsiveClass}`}>
                                                <FileTextIcon className={`dashboard-stats-icon ${responsiveClass}`} />
                                            </Box>
                                        }
                                        titleTypographyProps={{ className: `dashboard-stats-title ${responsiveClass}` }}
                                        className="dashboard-stats-header"
                                    />
                                    <CardContent className="dashboard-stats-content">
                                        <Typography className={`dashboard-stats-number ${responsiveClass}`}>{denuncias.length}</Typography>
                                        <Typography className={`dashboard-stats-subtitle ${responsiveClass}`}>
                                            {denuncias.filter((d) => new Date(d.created_at).getMonth() === new Date().getMonth()).length}{" "}
                                            registradas este mes
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Card className="dashboard-stats-card">
                                    <CardHeader
                                        title="Estadísticas por Tipo"
                                        subheader="Distribución de casos según su categoría"
                                        titleTypographyProps={{ className: `dashboard-stats-title ${responsiveClass}` }}
                                        subheaderTypographyProps={{ variant: "caption", fontSize: { xs: "0.7rem", md: "0.75rem" } }}
                                        className="dashboard-stats-header"
                                    />
                                    <CardContent>
                                        {estadisticas.slice(0, isLaptop ? 6 : estadisticas.length).map((stat) => (
                                            <Box key={stat.tipo} className={`dashboard-progress-item ${responsiveClass}`}>
                                                <Typography className={`dashboard-progress-label ${responsiveClass}`}>{stat.tipo}</Typography>
                                                <Box className={`dashboard-progress-bar ${responsiveClass}`}>
                                                    <Box
                                                        className="dashboard-progress-fill"
                                                        sx={{
                                                            width: `${(stat.cantidad / Math.max(...estadisticas.map((s) => s.cantidad))) * 100}%`,
                                                        }}
                                                    />
                                                </Box>
                                                <Typography className={`dashboard-progress-value ${responsiveClass}`}>
                                                    {stat.cantidad}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                                        <MuiButton
                                            variant="outlined"
                                            size="small"
                                            className={`dashboard-button dashboard-button-outline ${responsiveClass}`}
                                        >
                                            Ver informe completo
                                        </MuiButton>
                                    </CardActions>
                                </Card>

                                {!isLaptop && (
                                    <Card className="dashboard-stats-card">
                                        <CardHeader
                                            title="Distribución por Campus"
                                            titleTypographyProps={{ className: `dashboard-stats-title ${responsiveClass}` }}
                                            className="dashboard-stats-header"
                                        />
                                        <CardContent>
                                            {campusList.map((campus) => (
                                                <Box key={campus.id} className="dashboard-progress-item">
                                                    <Typography className="dashboard-progress-label desktop">{campus.nombre}</Typography>
                                                    <Box className="dashboard-progress-bar desktop">
                                                        <Box
                                                            className="dashboard-progress-fill"
                                                            sx={{
                                                                width: `${(campus.denuncias / Math.max(...campusList.map((c) => c.denuncias))) * 100}%`,
                                                                backgroundColor: "#9c27b0",
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography className="dashboard-progress-value desktop">{campus.denuncias}</Typography>
                                                </Box>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </Box>
                        </CardContent>
                        <CardActions className={`dashboard-card-footer ${responsiveClass}`}>
                            <MuiButton
                                variant="contained"
                                size="medium"
                                className={`dashboard-button dashboard-button-contained ${responsiveClass}`}
                            >
                                Ver todas los casos
                            </MuiButton>
                        </CardActions>
                    </Card>
                </Box>
            </Box>

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '90%' : 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                }}>
                    <Typography variant="h6" gutterBottom>
                        Editar Denuncia #{selectedDenuncia?.id}
                    </Typography>
                    {selectedDenuncia && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography>Estado:</Typography>
                                <Switch
                                    checked={estadoLocal === 'tomada'}
                                    onChange={(e) => setEstadoLocal(e.target.checked ? 'tomada' : 'pendiente')}
                                />
                                <Typography>{estadoLocal === 'tomada' ? 'Tomada' : 'Pendiente'}</Typography>
                            </Box>
                            <TextField
                                label="Comentarios"
                                multiline
                                rows={4}
                                value={comentariosLocal}
                                onChange={(e) => setComentariosLocal(e.target.value)}
                                fullWidth
                                variant="outlined"
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <MuiButton variant="outlined" onClick={handleCloseModal} sx={{ mr: 2 }}>
                                    Cancelar
                                </MuiButton>
                                <MuiButton variant="contained" onClick={handleSaveChanges}>
                                    Guardar
                                </MuiButton>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    )
}