import {
    Description as FileTextIcon,
    Menu as MenuIcon,
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
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import MuiBadge from '@mui/material/Badge';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import EstadoBadge from './EstadoBadge';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const denunciasFiltradas =
        campusSeleccionado === 'todos'
            ? denuncias
            : denuncias.filter((d) => d.campus === campusSeleccionado);

    const pendientes = denuncias.filter((d) => d.tipo_incidente === 'Pendiente').length;
    const enProceso = denuncias.filter((d) => d.tipo_incidente === 'En Proceso').length;
    const resueltas = denuncias.filter((d) => d.tipo_incidente === 'Resuelto').length;

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
        return <Typography>Cargando datos...</Typography>;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: '100vh',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="h5">Dashboard de Denuncias</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Monitoreo y gestión de denuncias de género
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Buscar denuncia..."
                            sx={{ width: { xs: 200, md: 260 } }}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'textSecondary', mr: 1 }} />,
                            }}
                        />
                        <IconButton sx={{ display: { md: 'none' } }} onClick={() => setSidebarOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardHeader
                            title="Total Denuncias"
                            action={<FileTextIcon />}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                        />
                        <CardContent>
                            <Typography variant="h5">{denuncias.length}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                {denuncias.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth()).length} registradas este mes
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200, marginRight: 2 }}>
                        <CardHeader
                            title="Pendientes"
                            action={<MuiBadge badgeContent={pendientes} color="error" />}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                        />
                        <CardContent>
                            <Typography variant="h5">{pendientes}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                Requieren atención inmediata
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardHeader
                            title="En Proceso"
                            action={<MuiBadge badgeContent={enProceso} color="warning" />}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                        />
                        <CardContent>
                            <Typography variant="h5">{enProceso}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                En investigación activa
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardHeader
                            title="Resueltas"
                            action={<MuiBadge badgeContent={resueltas} color="success" />}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                        />
                        <CardContent>
                            <Typography variant="h5">{resueltas}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                Casos cerrados satisfactoriamente
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginRight: 2 }}>
                    <Card sx={{ flex: '2 1 400px', minWidth: 300 }}>
                        <CardHeader
                            title="Denuncias Recientes"
                            subheader="Lista de las últimas denuncias registradas en el sistema"
                            action={
                                <FormControl sx={{ minWidth: 180 }}>
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
                            }
                        />
                        <CardContent>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, fontSize: '0.75rem', color: 'textSecondary', mb: 2 }}>
                                <Typography>Fecha</Typography>
                                <Typography>Tipo</Typography>
                                <Typography>Campus</Typography>
                                <Typography>Estado</Typography>
                                <Typography>Denunciante</Typography>
                            </Box>
                            {denunciasFiltradas.map((denuncia) => (
                                <Box key={denuncia.id} sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2">{format(new Date(denuncia.created_at), 'dd MMM yyyy', { locale: es })}</Typography>
                                    <Typography variant="body2">{denuncia.tipo_incidente}</Typography>
                                    <Typography variant="body2">{denuncia.campus}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'left', paddingLeft: 3, alignItems: 'center' }}>
                                        <EstadoBadge estado={denuncia.tipo_incidente} />
                                    </Box>
                                    <Typography variant="body2">{`${denuncia.nombre} ${denuncia.apellido}`}</Typography>
                                </Box>
                            ))}
                            {denunciasFiltradas.length === 0 && (
                                <Typography sx={{ textAlign: 'center', py: 4, color: 'textSecondary' }}>
                                    No hay denuncias para mostrar
                                </Typography>
                            )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                            <Button variant="outlined" size="small">Ver todas las denuncias</Button>
                        </CardActions>
                    </Card>

                    <Card sx={{ flex: '1 1 300px', minWidth: 300, marginRight: 2 }}>
                        <CardHeader
                            title="Estadísticas por Tipo"
                            subheader="Distribución de denuncias según su categoría"
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
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                            <Button variant="outlined" size="small">Ver informe completo</Button>
                        </CardActions>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}