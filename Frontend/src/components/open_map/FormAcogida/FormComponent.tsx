import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
    nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    apellido: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    email: z.string().email({ message: 'Por favor ingrese un email válido.' }),
    telefono: z.string().min(8, { message: 'Por favor ingrese un número de teléfono válido.' }),
    tipo_incidente: z.string({ required_error: 'Por favor seleccione un tipo de incidente.' }),
    fecha_incidente: z
        .string({ required_error: 'Por favor ingrese la fecha del incidente.' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en formato YYYY-MM-DD.' }),
    lugar_incidente: z.string().min(2, { message: 'Por favor ingrese el lugar del incidente.' }),
    descripcion: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
    campus: z.string().optional(),
    encargado_acogida: z.string().min(2, { message: 'El nombre del encargado debe tener al menos 2 caracteres.' }),
});

type FormData = z.infer<typeof formSchema>;

interface FormComponentProps {
    campus: string | undefined;
    setSubmitted: (value: boolean) => void;
    setFormErrors: (errors: Record<string, string>) => void;
    setError: (error: string | null) => void;
}

const FormComponent: React.FC<FormComponentProps> = ({
    campus,
    setSubmitted,
    setFormErrors,
    setError,
}) => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            tipo_incidente: '',
            fecha_incidente: '',
            lugar_incidente: '',
            descripcion: '',
            campus: campus || '',
            encargado_acogida: '',
        },
    });

    const [successModalOpen, setSuccessModalOpen] = React.useState(false);

    const onSubmit = async (data: FormData) => {
        setFormErrors({});
        try {
            console.log('Enviando datos:', data); // Log para depuración
            const response = await axios.post('http://localhost:8000/api/denuncias/', data, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            console.log('Respuesta del servidor:', response.data); // Log para depuración
            setSubmitted(true);
            setSuccessModalOpen(true);
        } catch (error: any) {
            console.error('Error al enviar la denuncia:', error); // Log para depuración
            if (error.response) {
                const serverErrors = error.response.data;
                if (serverErrors && typeof serverErrors === 'object') {
                    setFormErrors(serverErrors);
                } else {
                    setError('Error al enviar la denuncia: ' + error.response.data.detail);
                }
            } else {
                setError('Error al enviar la denuncia: ' + error.message);
            }
        }
    };

    return (
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} className="openmap-form">
            <Typography variant="h5" className="openmap-form-title">
                Formulario de Acogida
            </Typography>
            <Typography>
                Complete el formulario para reportar un incidente relacionado con violencia o
                discriminación de género.
            </Typography>

            <Box className="openmap-form-section">
                <Typography variant="h6">Información Personal</Typography>
                <TextField
                    label="Nombre"
                    {...form.register('nombre')}
                    error={!!form.formState.errors.nombre || !!form.getFieldState('nombre').error}
                    helperText={form.formState.errors.nombre?.message || form.getFieldState('nombre').error?.message}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Apellido"
                    {...form.register('apellido')}
                    error={!!form.formState.errors.apellido || !!form.getFieldState('apellido').error}
                    helperText={form.formState.errors.apellido?.message || form.getFieldState('apellido').error?.message}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Correo Electrónico"
                    type="email"
                    {...form.register('email')}
                    error={!!form.formState.errors.email || !!form.getFieldState('email').error}
                    helperText={form.formState.errors.email?.message || form.getFieldState('email').error?.message}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Teléfono"
                    {...form.register('telefono')}
                    error={!!form.formState.errors.telefono || !!form.getFieldState('telefono').error}
                    helperText={form.formState.errors.telefono?.message || form.getFieldState('telefono').error?.message}
                    fullWidth
                    margin="normal"
                    required
                />
            </Box>

            <Box className="openmap-form-section">
                <Typography variant="h6">Detalles del Incidente</Typography>
                <FormControl
                    fullWidth
                    margin="normal"
                    error={!!form.formState.errors.tipo_incidente || !!form.getFieldState('tipo_incidente').error}
                >
                    <InputLabel>Tipo de Incidente</InputLabel>
                    <Select
                        {...form.register('tipo_incidente')}
                        value={form.watch('tipo_incidente')}
                        onChange={(e) => form.setValue('tipo_incidente', e.target.value as string)}
                    >
                        <MenuItem value="">Seleccione el tipo de incidente</MenuItem>
                        <MenuItem value="Acoso_sexual">Acoso Sexual</MenuItem>
                        <MenuItem value="Violencia_fisica">Violencia Física</MenuItem>
                        <MenuItem value="Violencia_psicologica">Violencia Psicológica</MenuItem>
                        <MenuItem value="Discriminacion">Discriminación de Género</MenuItem>
                        <MenuItem value="No estoy seguro necesito orientación">Otro</MenuItem>
                    </Select>
                    {(form.formState.errors.tipo_incidente || form.getFieldState('tipo_incidente').error) && (
                        <Typography color="error">
                            {form.formState.errors.tipo_incidente?.message ||
                                form.getFieldState('tipo_incidente').error?.message}
                        </Typography>
                    )}
                </FormControl>
                <TextField
                    label="Fecha del Incidente"
                    type="date"
                    {...form.register('fecha_incidente')}
                    error={!!form.formState.errors.fecha_incidente || !!form.getFieldState('fecha_incidente').error}
                    helperText={
                        form.formState.errors.fecha_incidente?.message ||
                        form.getFieldState('fecha_incidente').error?.message
                    }
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                />
                <TextField
                    label="Lugar del Incidente"
                    {...form.register('lugar_incidente')}
                    error={!!form.formState.errors.lugar_incidente || !!form.getFieldState('lugar_incidente').error}
                    helperText={
                        form.formState.errors.lugar_incidente?.message ||
                        form.getFieldState('lugar_incidente').error?.message
                    }
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Descripción del Incidente"
                    multiline
                    rows={4}
                    {...form.register('descripcion')}
                    error={!!form.formState.errors.descripcion || !!form.getFieldState('descripcion').error}
                    helperText={
                        form.formState.errors.descripcion?.message ||
                        form.getFieldState('descripcion').error?.message ||
                        'Incluya todos los detalles relevantes.'
                    }
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Nombre del Encargado de Acogida"
                    {...form.register('encargado_acogida')}
                    error={!!form.formState.errors.encargado_acogida || !!form.getFieldState('encargado_acogida').error}
                    helperText={
                        form.formState.errors.encargado_acogida?.message ||
                        form.getFieldState('encargado_acogida').error?.message
                    }
                    fullWidth
                    margin="normal"
                    required
                />
            </Box>

            <Button type="submit" variant="contained" color="primary" className="openmap-form-button">
                Enviar entrevista
            </Button>
            <Dialog open={successModalOpen} onClose={() => setSuccessModalOpen(false)}>
                <DialogTitle>¡Entrevista enviada!</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tu entrevista de acogida fue enviada exitosamente. Pronto nos pondremos en contacto contigo.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSuccessModalOpen(false)} color="primary" variant="contained">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FormComponent;