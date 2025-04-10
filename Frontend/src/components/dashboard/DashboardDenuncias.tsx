// DashboardDenuncias.tsx
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import EstadoBadge from './EstadoBadge';

// Datos de ejemplo
const denunciasRecientes = [
    {
        id: 1,
        fecha: new Date(2023, 3, 15),
        tipo: 'Acoso Sexual',
        campus: 'Campus Colchagua',
        estado: 'Pendiente',
        denunciante: 'Anónimo',
    },
    {
        id: 2,
        fecha: new Date(2023, 3, 12),
        tipo: 'Discriminación de Género',
        campus: 'Campus Talca',
        estado: 'En Proceso',
        denunciante: 'María López',
    },
    {
        id: 3,
        fecha: new Date(2023, 3, 10),
        tipo: 'Violencia Psicológica',
        campus: 'Campus Curico',
        estado: 'Resuelto',
        denunciante: 'Juan Pérez',
    },
    {
        id: 4,
        fecha: new Date(2023, 3, 8),
        tipo: 'Acoso Laboral',
        campus: 'Campus Pehuenche',
        estado: 'Pendiente',
        denunciante: 'Anónimo',
    },
    {
        id: 5,
        fecha: new Date(2023, 3, 5),
        tipo: 'Violencia Física',
        campus: 'Campus Linares',
        estado: 'Resuelto',
        denunciante: 'Carlos Rodríguez',
    },
];

const estadisticasPorTipo = [
    { tipo: 'Acoso Sexual', cantidad: 18 },
    { tipo: 'Discriminación de Género', cantidad: 12 },
    { tipo: 'Violencia Psicológica', cantidad: 15 },
    { tipo: 'Acoso Laboral', cantidad: 9 },
    { tipo: 'Violencia Física', cantidad: 6 },
    { tipo: 'Otro', cantidad: 5 },
];

// Datos de campus (se podrían mover a un archivo separado o pasar como props)
const campusUniversitarios = [
    { id: 1, nombre: 'Campus Talca', denuncias: 24 },
    { id: 2, nombre: 'Campus Curico', denuncias: 12 },
    { id: 3, nombre: 'Campus Linares', denuncias: 8 },
    { id: 4, nombre: 'Campus Santiago', denuncias: 15 },
    { id: 5, nombre: 'Campus Pehuenche', denuncias: 6 },
    { id: 6, nombre: 'Campus Colchagua', denuncias: 6 },
];

export default function DashboardDenuncias() {
    const [campusSeleccionado, setCampusSeleccionado] = useState<string>('todos');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const denunciasFiltradas =
        campusSeleccionado === 'todos'
            ? denunciasRecientes
            : denunciasRecientes.filter((d) => d.campus === campusSeleccionado);

    const pendientes = denunciasRecientes.filter((d) => d.estado === 'Pendiente').length;
    const enProceso = denunciasRecientes.filter((d) => d.estado === 'En Proceso').length;
    const resueltas = denunciasRecientes.filter((d) => d.estado === 'Resuelto').length;

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
                            <Typography variant="h5">{denunciasRecientes.length}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                5 registradas este mes
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
                                        {campusUniversitarios.map((campus) => (
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
                                    <Typography variant="body2">{format(denuncia.fecha, 'dd MMM yyyy', { locale: es })}</Typography>
                                    <Typography variant="body2">{denuncia.tipo}</Typography>
                                    <Typography variant="body2">{denuncia.campus}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'left', paddingLeft: 3, alignItems: 'center' }}>
                                        <EstadoBadge estado={denuncia.estado} />
                                    </Box>
                                    <Typography variant="body2">{denuncia.denunciante}</Typography>
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
                            {estadisticasPorTipo.map((stat) => (
                                <Box key={stat.tipo} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography sx={{ width: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.tipo}</Typography>
                                    <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.300', borderRadius: 4, overflow: 'hidden', mx: 2 }}>
                                        <Box sx={{ width: `${(stat.cantidad / 65) * 100}%`, height: '100%', bgcolor: 'rose.600' }} />
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