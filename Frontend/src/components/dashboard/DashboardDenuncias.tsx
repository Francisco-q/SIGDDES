import {
    Description as FileTextIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
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
    Select,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import TipoBadge from './TipoBadge';

interface Denuncia {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    tipo_incidente: string;
    fecha_incidente: string;
    lugar_incidente: string;
    descripcion: string;
    created_at: string;
    campus: string;
}

export default function DashboardDenuncias() {
    const [campusSeleccionado, setCampusSeleccionado] = useState<string>('todos');
    const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Estado para ordenamiento
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pageSize = 15;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get('http://localhost:8000/api/denuncias/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDenuncias(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error al cargar los datos');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtrado combinado: por campus, búsqueda y ordenamiento
    const denunciasFiltradas = denuncias
        .filter((denuncia) => {
            const matchesCampus =
                campusSeleccionado === 'todos' || denuncia.campus === campusSeleccionado;
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === '' ||
                denuncia.nombre.toLowerCase().includes(query) ||
                denuncia.apellido.toLowerCase().includes(query) ||
                denuncia.tipo_incidente.toLowerCase().includes(query) ||
                denuncia.campus.toLowerCase().includes(query) ||
                denuncia.descripcion.toLowerCase().includes(query);
            return matchesCampus && matchesSearch;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortOrder === 'desc'
                ? dateB.getTime() - dateA.getTime() // Más reciente primero
                : dateA.getTime() - dateB.getTime(); // Más antigua primero
        });

    // Paginación
    const totalPages = Math.ceil(denunciasFiltradas.length / pageSize);
    const paginatedDenuncias = denunciasFiltradas.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    const estadisticas = Object.entries(
        denuncias.reduce((acc, denuncia) => {
            acc[denuncia.tipo_incidente] = (acc[denuncia.tipo_incidente] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([tipo, cantidad]) => ({ tipo, cantidad }));

    const campusList = Array.from(
        new Set(denuncias.map((d) => d.campus))
    ).map((nombre, id) => ({ id: id + 1, nombre, denuncias: denuncias.filter(d => d.campus === nombre).length }));

    if (loading) {
        return <Typography sx={{ textAlign: 'center' }}>Cargando datos...</Typography>;
    }

    if (error) {
        return <Typography sx={{ textAlign: 'center' }} color="error">{error}</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: '100vh',
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', justifyContent: 'center', mb: 4 }}>
                    <Card sx={{ flex: '1 1 100%', minWidth: 300, maxWidth: 1400, margin: 'auto' }}>
                        <CardHeader
                            title="Casos Recientes"
                            subheader="Lista de casos registrados en el sistema"
                            titleTypographyProps={{ textAlign: 'center' }}
                            subheaderTypographyProps={{ textAlign: 'center' }}
                        />
                        <CardContent>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', width: '100%' }}>
                                <Card sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: 300 }}>
                                    <CardHeader
                                        title="Total Denuncias"
                                        action={<FileTextIcon />}
                                        titleTypographyProps={{ variant: 'subtitle2', textAlign: 'center' }}
                                    />
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5">{denuncias.length}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {denuncias.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth()).length} registradas este mes
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Card sx={{ flex: '2 1 300px', minWidth: 300, maxWidth: 400 }}>
                                    <CardHeader
                                        title="Estadísticas por Tipo"
                                        subheader="Distribución de denuncias según su categoría"
                                        titleTypographyProps={{ textAlign: 'center' }}
                                        subheaderTypographyProps={{ textAlign: 'center' }}
                                    />
                                    <CardContent>
                                        {estadisticas.map((stat) => (
                                            <Box key={stat.tipo} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Typography sx={{ width: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.tipo}</Typography>
                                                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.300', borderRadius: 4, overflow: 'hidden', mx: 2 }}>
                                                    <Box sx={{ width: `${(stat.cantidad / Math.max(...estadisticas.map(s => s.cantidad))) * 100}%`, height: '100%', bgcolor: 'rose.600' }} />
                                                </Box>
                                                <Typography sx={{ width: 40, textAlign: 'right' }}>{stat.cantidad}</Typography>
                                            </Box>
                                        ))}
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'center' }}>
                                        <Button variant="outlined" size="small">Ver informe completo</Button>
                                    </CardActions>
                                </Card>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    mb: 2,
                                    mt: 4,
                                    justifyContent: 'center',
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                }}
                            >
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    placeholder="Buscar caso..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    sx={{
                                        flex: { xs: '1 1 100%', sm: '1 1 260px' },
                                        maxWidth: { xs: '100%', sm: 260 },
                                    }}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'textSecondary', mr: 1 }} />,
                                    }}
                                />
                                <FormControl sx={{ flex: { xs: '1 1 100%', sm: '1 1 180px' }, minWidth: 180 }}>
                                    <InputLabel>Filtrar por campus</InputLabel>
                                    <Select
                                        value={campusSeleccionado}
                                        onChange={(e) => setCampusSeleccionado(e.target.value as string)}
                                    >
                                        <MenuItem value="todos">Todos los campus</MenuItem>
                                        {campusList.map((campus) => (
                                            <MenuItem key={campus.id} value={campus.nombre}>
                                                {campus.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl sx={{ flex: { xs: '1 1 100%', sm: '1 1 180px' }, minWidth: 180 }}>
                                    <InputLabel>Ordenar por fecha</InputLabel>
                                    <Select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                                    >
                                        <MenuItem value="desc">Más reciente primero</MenuItem>
                                        <MenuItem value="asc">Más antigua primero</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                {paginatedDenuncias.map((denuncia) => (
                                    <Card key={denuncia.id} sx={{ width: '100%', maxWidth: 600, p: 1 }}>
                                        <CardContent>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    gap: 1,
                                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Box sx={{ flex: '1 1 0', minWidth: 100, textAlign: { xs: 'left', sm: 'center' } }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Fecha
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {format(new Date(denuncia.created_at), 'dd/MM/yyyy', { locale: es })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flex: '1 1 0', minWidth: 100, textAlign: { xs: 'left', sm: 'center' } }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Campus
                                                    </Typography>
                                                    <Typography variant="body2">{denuncia.campus}</Typography>
                                                </Box>
                                                <Box sx={{ flex: '1 1 0', minWidth: 100, textAlign: { xs: 'left', sm: 'center' } }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Tipo
                                                    </Typography>
                                                    <TipoBadge tipo={denuncia.tipo_incidente} />
                                                </Box>
                                                <Box sx={{ flex: '1 1 0', minWidth: 100, textAlign: { xs: 'left', sm: 'center' } }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Afectado
                                                    </Typography>
                                                    <Typography variant="body2">{`${denuncia.nombre} ${denuncia.apellido}`}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                                {paginatedDenuncias.length === 0 && (
                                    <Typography sx={{ textAlign: 'center', py: 4, color: 'textSecondary' }}>
                                        No hay casos para mostrar
                                    </Typography>
                                )}
                            </Box>
                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'center' }}>
                            <Button variant="outlined" size="small">Ver todas las denuncias</Button>
                        </CardActions>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}