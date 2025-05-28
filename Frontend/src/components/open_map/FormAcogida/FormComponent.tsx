"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
    CheckCircle as CheckCircleIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
} from "@mui/icons-material"
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
} from "@mui/material"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import axios from "axios"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import "./FormComponent.css"

const formSchema = z.object({
    nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    apellido: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
    email: z.string().email({ message: "Por favor ingrese un email válido." }),
    telefono: z.string().min(8, { message: "Por favor ingrese un número de teléfono válido." }),
    tipo_incidente: z.string({ required_error: "Por favor seleccione un tipo de incidente." }),
    fecha_incidente: z.string().min(1, { message: "Por favor seleccione la fecha del incidente." }),
    lugar_incidente: z.string().min(2, { message: "Por favor ingrese el lugar del incidente." }),
    descripcion: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
    campus: z.string().optional(),
    encargado_acogida: z.string().min(2, { message: "El nombre del encargado debe tener al menos 2 caracteres." }),
})

type FormData = z.infer<typeof formSchema>

interface FormComponentProps {
    campus: string | undefined
    setSubmitted: (value: boolean) => void
    setFormErrors: (errors: Record<string, string>) => void
    setError: (error: string | null) => void
}

const FormComponent: React.FC<FormComponentProps> = ({ campus, setSubmitted, setFormErrors, setError }) => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            apellido: "",
            email: "",
            telefono: "",
            tipo_incidente: "",
            fecha_incidente: "",
            lugar_incidente: "",
            descripcion: "",
            campus: campus || "",
            encargado_acogida: "",
        },
    })

    const [successModalOpen, setSuccessModalOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [fechaIncidente, setFechaIncidente] = React.useState<Date | null>(null)
    const [fechaError, setFechaError] = React.useState<string>("")

    const validateFecha = (fecha: Date | null): boolean => {
        if (!fecha) {
            setFechaError("Por favor seleccione la fecha del incidente.")
            return false
        }

        const hoy = new Date()
        const hace5Anos = new Date()
        hace5Anos.setFullYear(hoy.getFullYear() - 5)

        if (fecha > hoy) {
            setFechaError("La fecha no puede ser futura.")
            return false
        }

        if (fecha < hace5Anos) {
            setFechaError("La fecha no puede ser anterior a 5 años.")
            return false
        }

        setFechaError("")
        return true
    }

    const onSubmit = async (data: FormData) => {
        setFormErrors({})

        if (!validateFecha(fechaIncidente)) {
            return
        }

        // Validar que la descripción no esté vacía
        if (!data.descripcion || data.descripcion.trim().length === 0) {
            setError("La descripción del incidente es requerida.")
            return
        }
        setIsSubmitting(true)
        try {
            // Formatear la fecha antes de enviar
            const formattedData = {
                ...data,
                fecha_incidente: fechaIncidente ? format(fechaIncidente, "yyyy-MM-dd") : "",
            }

            console.log("Enviando datos:", formattedData)
            const response = await axios.post("http://localhost:8000/api/denuncias/", formattedData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
            })
            console.log("Respuesta del servidor:", response.data)
            setSubmitted(true)
            setSuccessModalOpen(true)
            form.reset()
            setFechaIncidente(null)
        } catch (error: any) {
            console.error("Error al enviar la denuncia:", error)
            if (error.response) {
                const serverErrors = error.response.data
                if (serverErrors && typeof serverErrors === "object") {
                    setFormErrors(serverErrors)
                } else {
                    setError("Error al enviar la denuncia: " + error.response.data.detail)
                }
            } else {
                setError("Error al enviar la denuncia: " + error.message)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCloseSuccessModal = () => {
        setSuccessModalOpen(false)
        setSubmitted(false)
    }

    const handleFechaChange = (newValue: Date | null) => {
        setFechaIncidente(newValue)
        if (newValue) {
            const fechaFormateada = format(newValue, "yyyy-MM-dd")
            form.setValue("fecha_incidente", fechaFormateada)
            validateFecha(newValue)
        } else {
            form.setValue("fecha_incidente", "")
            setFechaError("Por favor seleccione la fecha del incidente.")
        }
    }

    return (
        <Box className="form-component-container">
            {/* Header */}
            <Box className="form-component-header">
                <Typography className="form-component-title">Formulario de Acogida</Typography>
            </Box>

            <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
                {/* Sección: Información Personal */}
                <Box className="form-component-section">
                    <Typography className="form-component-section-title">
                        <PersonIcon />
                        Información Personal
                    </Typography>

                    <Box className="form-component-grid two-columns">
                        <Box className="form-component-field">
                            <TextField
                                label="Nombre"
                                {...form.register("nombre")}
                                error={!!form.formState.errors.nombre}
                                helperText={form.formState.errors.nombre?.message}
                                fullWidth
                                required
                                placeholder="Ingrese su nombre"
                            />
                        </Box>

                        <Box className="form-component-field">
                            <TextField
                                label="Apellido"
                                {...form.register("apellido")}
                                error={!!form.formState.errors.apellido}
                                helperText={form.formState.errors.apellido?.message}
                                fullWidth
                                required
                                placeholder="Ingrese su apellido"
                            />
                        </Box>
                    </Box>

                    <Box className="form-component-grid two-columns">
                        <Box className="form-component-field">
                            <TextField
                                label="Correo Electrónico"
                                type="email"
                                {...form.register("email")}
                                error={!!form.formState.errors.email}
                                helperText={form.formState.errors.email?.message}
                                fullWidth
                                required
                                placeholder="ejemplo@correo.com"
                            />
                        </Box>

                        <Box className="form-component-field">
                            <TextField
                                label="Teléfono"
                                {...form.register("telefono")}
                                error={!!form.formState.errors.telefono}
                                helperText={form.formState.errors.telefono?.message}
                                fullWidth
                                required
                                placeholder="+56 9 1234 5678"
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Sección: Detalles del Incidente */}
                <Box className="form-component-section">
                    <Typography className="form-component-section-title">
                        <DescriptionIcon />
                        Detalles del Incidente
                    </Typography>

                    <Box className="form-component-field">
                        <FormControl fullWidth error={!!form.formState.errors.tipo_incidente} className="form-component-select">
                            <InputLabel>Tipo de Incidente *</InputLabel>
                            <Select
                                {...form.register("tipo_incidente")}
                                value={form.watch("tipo_incidente")}
                                onChange={(e) => form.setValue("tipo_incidente", e.target.value as string)}
                                label="Tipo de Incidente *"
                            >
                                <MenuItem value="">Seleccione el tipo de incidente</MenuItem>
                                <MenuItem value="Acoso_sexual">Acoso Sexual</MenuItem>
                                <MenuItem value="Violencia_fisica">Violencia Física</MenuItem>
                                <MenuItem value="Violencia_psicologica">Violencia Psicológica</MenuItem>
                                <MenuItem value="Discriminacion">Discriminación de Género</MenuItem>
                                <MenuItem value="No estoy seguro necesito orientación">Necesito Orientación</MenuItem>
                            </Select>
                            {form.formState.errors.tipo_incidente && (
                                <Typography color="error" variant="caption" sx={{ mt: 1, ml: 2 }}>
                                    {form.formState.errors.tipo_incidente?.message}
                                </Typography>
                            )}
                        </FormControl>
                    </Box>

                    <Box className="form-component-grid two-columns">
                        <Box className="form-component-field">
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha del Incidente *"
                                    value={fechaIncidente}
                                    onChange={handleFechaChange}
                                    maxDate={new Date()}
                                    minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 5))}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: !!fechaError || !!form.formState.errors.fecha_incidente,
                                            helperText:
                                                fechaError ||
                                                form.formState.errors.fecha_incidente?.message ||
                                                "Seleccione cuándo ocurrió el incidente",
                                            placeholder: "dd/mm/aaaa",
                                        },
                                    }}
                                    format="dd/MM/yyyy"
                                />
                            </LocalizationProvider>
                        </Box>

                        <Box className="form-component-field">
                            <TextField
                                label="Lugar del Incidente"
                                {...form.register("lugar_incidente")}
                                error={!!form.formState.errors.lugar_incidente}
                                helperText={form.formState.errors.lugar_incidente?.message}
                                fullWidth
                                required
                                placeholder="Edificio, sala, campus, etc."
                            />
                        </Box>
                    </Box>

                    <Box className="form-component-field form-component-textarea">
                        <TextField
                            label="Descripción del Incidente"
                            multiline
                            rows={5}
                            {...form.register("descripcion")}
                            error={!!form.formState.errors.descripcion}
                            helperText={
                                form.formState.errors.descripcion?.message ||
                                "Incluya todos los detalles relevantes. Esta información es confidencial."
                            }
                            fullWidth
                            required
                            placeholder="Describa lo ocurrido con el mayor detalle posible..."
                        />
                    </Box>

                    <Box className="form-component-field">
                        <TextField
                            label="Nombre del Encargado de Acogida"
                            {...form.register("encargado_acogida")}
                            error={!!form.formState.errors.encargado_acogida}
                            helperText={
                                form.formState.errors.encargado_acogida?.message || "Persona que realizó la entrevista de acogida"
                            }
                            fullWidth
                            required
                            placeholder="Nombre completo del encargado"
                        />
                    </Box>
                </Box>

                <Button type="submit" variant="contained" disabled={isSubmitting} className="form-component-submit-button">
                    {isSubmitting ? (
                        <Box className="form-component-loading">
                            <Box className="form-component-loading-spinner" />
                            Enviando entrevista...
                        </Box>
                    ) : (
                        "Enviar Entrevista de Acogida"
                    )}
                </Button>
            </Box>

            {/* Modal de éxito */}
            <Dialog
                open={successModalOpen}
                onClose={handleCloseSuccessModal}
                className="form-component-success-modal"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <CheckCircleIcon sx={{ fontSize: 48, color: "#10b981", display: "block", margin: "0 auto 16px" }} />
                    ¡Entrevista Enviada Exitosamente!
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Tu entrevista de acogida ha sido registrada correctamente en nuestro sistema. Nuestro equipo especializado
                        revisará la información y se pondrá en contacto contigo a la brevedad.
                    </Typography>
                    <Typography sx={{ mt: 2, fontWeight: 500, color: "#6200ea" }}>
                        Recuerda que toda la información es tratada de manera estrictamente confidencial.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSuccessModal} variant="contained">
                        Entendido
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default FormComponent
