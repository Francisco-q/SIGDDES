"use client"
import {
  Cancel as CancelIcon,
  Home as HomeIcon,
  QrCode as QrCodeIcon,
  ReportProblem as ReportIcon,
  Route as RouteIcon,
  Save as SaveIcon,
  ShieldMoon as ShieldIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import "leaflet/dist/leaflet.css";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createAttentionReport, deletePath, fetchPaths, fetchReceptions, fetchTotems, uploadImages } from "../../../services/apiService";
import axiosInstance from "../../../services/axiosInstance";
import type { Path, ReceptionQR, TotemQR } from "../../../types/types";
import FormComponent from "../FormAcogida/FormComponent";
import InfoPunto from "../info_punto/InfoPunto";
import MapComponent from "./MapComponent";
import "./OpenMap.css";

const OpenMap: React.FC = () => {
  const { campus } = useParams<{ campus: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [svgError, setSvgError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [initialPoint, setInitialPoint] = useState<TotemQR | ReceptionQR | null>(null)
  const [showPointNames, setShowPointNames] = useState(false)

  const campusSvgMap: Record<string, string> = {
    talca: "/assets/Talca.svg",
    curico: "/assets/Curico.svg",
    colchagua: "/assets/Colchagua.svg",
    pehuenche: "/assets/Pehuenche.svg",
    santiago: "/assets/Santiago.svg",
    linares: "/assets/Linares.svg",
  }

  const getMapaSrc = (campus: string | undefined) => {
    if (!campus) {
      return { src: "", error: "No se especificó un campus." }
    }
    const campusLower = campus.toLowerCase()
    const src = campusSvgMap[campusLower]
    if (!src) {
      return { src: "", error: `No se encontró un mapa para el campus ${campus}.` }
    }
    return { src, error: null }
  }

  const [totems, setTotems] = useState<TotemQR[]>([])
  const [receptions, setReceptions] = useState<ReceptionQR[]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [showPaths, setShowPaths] = useState(false)
  const [isCreatingPath, setIsCreatingPath] = useState(false)
  const [isCreatingTotem, setIsCreatingTotem] = useState(false)
  const [isCreatingReception, setIsCreatingReception] = useState(false)
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number][]>([])
  const [selectedPoint, setSelectedPoint] = useState<TotemQR | ReceptionQR | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pathName, setPathName] = useState("")
  const [pathSaved, setPathSaved] = useState(false)
  const [warningModalOpen, setWarningModalOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [tabValue, setTabValue] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [selectedPath, setSelectedPath] = useState<Path | null>(null)
  const [isPathModalOpen, setIsPathModalOpen] = useState(false)

  // Estados para el reporte de atención
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportData, setReportData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    motivos: {
      noHabiaPersonal: false,
      oficinaCerrada: false,
      largoTiempoEspera: false,
      personalOcupado: false,
      otro: false,
    },
    comentarios: "",
    campus: campus || "",
  })

  useEffect(() => {
    if (warningModalOpen) {
      const timer = setTimeout(() => {
        setWarningModalOpen(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [warningModalOpen])

  useEffect(() => {
    const pointId = searchParams.get("pointId")
    const pointType = searchParams.get("pointType")
    if (pointId && pointType && campus) {
      const fetchInitialPoint = async () => {
        try {
          const endpoint = pointType === "totem" ? "totems" : "recepciones"
          const response = await axiosInstance.get(`${endpoint}/${pointId}/`)
          setInitialPoint(response.data)
        } catch (err) {
          setError("No se pudo cargar el punto QR especificado.")
        }
      }
      fetchInitialPoint()
    }
  }, [searchParams, campus])

  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        setIsAuthenticated(false)
        setError("No hay sesión activa. Por favor, inicia sesión.")
        setLoading(false)
        return
      }

      try {
        const response = await axiosInstance.get("user/current_user/")
        setRole(response.data.role)
        setIsAuthenticated(true)
        setError(null)
      } catch (error: any) {
        console.error("Error validating token:", error)
        setIsAuthenticated(false)
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  useEffect(() => {
    if (isAuthenticated && role && ["admin", "user", "guest", "superuser"].includes(role) && campus) {
      const loadData = async () => {
        try {
          const [totemsData, receptionsData, pathsData] = await Promise.all([
            fetchTotems(campus),
            fetchReceptions(campus),
            fetchPaths(campus),
          ])
          setTotems(totemsData)
          setReceptions(receptionsData)
          setPaths(pathsData)
          setError(null)
        } catch (error: any) {
          console.error("Error fetching data:", error)
          setError("No se pudieron cargar los datos del mapa. Por favor, intenta de nuevo.")
        }
      }
      loadData()
    }
  }, [isAuthenticated, role, campus])

  useEffect(() => {
    const { src, error } = getMapaSrc(campus)
    if (error) {
      setSvgError(error)
    } else {
      setSvgError(null)
    }
  }, [campus])

  // Actualizar campus en reportData cuando cambie
  useEffect(() => {
    setReportData((prev) => ({ ...prev, campus: campus || "" }))
  }, [campus])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPoint(null)
    setImageFiles([])
  }

  const handleCreateTotem = async (lat: number, lng: number) => {
    const newTotem = {
      latitude: lat,
      longitude: lng,
      name: "Nuevo Totem QR",
      description: "",
      imageUrls: [],
      campus: campus || "",
      status: "Operativo",
    }
    try {
      const response = await axiosInstance.post("totems/", newTotem)
      const createdTotem = response.data
      setTotems([...totems, createdTotem])
      setSelectedPoint(createdTotem)
      setIsModalOpen(true)
    } catch (error: any) {
      console.error("Error al crear el tótem:", error)
      setWarningMessage("No se pudo crear el Tótem QR.")
      setWarningModalOpen(true)
    }
  }

  const handleCreateReception = async (lat: number, lng: number) => {
    const newReception = {
      latitude: lat,
      longitude: lng,
      name: "Nuevo Espacio Seguro",
      description: "",
      imageUrls: [],
      campus: campus || "",
      schedule: "",
      status: "Operativo",
    }
    try {
      const response = await axiosInstance.post("recepciones/", newReception)
      const createdReception = response.data
      setReceptions([...receptions, createdReception])
      setSelectedPoint(createdReception)
      setIsModalOpen(true)
    } catch (error: any) {
      console.error("Error al crear la recepción:", error)
      setWarningMessage("No se pudo crear la Recepción QR.")
      setWarningModalOpen(true)
    }
  }

  const handleSavePoint = async (updatedPoint: TotemQR | ReceptionQR) => {
    if (!updatedPoint || !["admin", "superuser"].includes(role as string)) return

    if (!updatedPoint.name || updatedPoint.name.trim().length < 2) {
      setError("El nombre del punto es requerido y debe tener al menos 2 caracteres.")
      return
    }
    if (!updatedPoint.campus) {
      setError("El campus es requerido.")
      return
    }
    if (typeof updatedPoint.latitude !== "number" || typeof updatedPoint.longitude !== "number") {
      setError("Las coordenadas (latitud y longitud) son requeridas.")
      return
    }

    const isTotem = !("schedule" in updatedPoint)

    try {
      let imageUrls = Array.isArray(updatedPoint.imageUrls) ? updatedPoint.imageUrls : []
      if (imageFiles.length > 0) {
        const newImageUrls = await uploadImages(
          imageFiles,
          updatedPoint.id,
          isTotem ? "totem" : "reception",
          updatedPoint.campus,
        )
        imageUrls = [...imageUrls, ...newImageUrls]
      }

      const pointData = {
        ...updatedPoint,
        imageUrls,
        description: updatedPoint.description || "",
        status: updatedPoint.status || "Operativo",
        ...(isTotem ? {} : { schedule: (updatedPoint as ReceptionQR).schedule || "" }),
      }

      const endpoint = isTotem ? "totems" : "recepciones"
      const response = await axiosInstance.put(`${endpoint}/${updatedPoint.id}/`, pointData)

      if (isTotem) {
        setTotems(totems.map((t) => (t.id === updatedPoint.id ? (response.data as TotemQR) : t)))
      } else {
        setReceptions(receptions.map((r) => (r.id === updatedPoint.id ? (response.data as ReceptionQR) : r)))
      }

      handleCloseModal()
    } catch (error: any) {
      console.error("Error al guardar el punto:", error)
      const errorMessage = error.response?.data?.detail || "No se pudo guardar el punto."
      setError(errorMessage)
    }
  }

  const handleDeletePoint = async (pointId: number, isTotem: boolean) => {
    if (!["admin", "superuser"].includes(role as string)) return

    try {
      const endpoint = isTotem ? "totems" : "recepciones"
      await axiosInstance.delete(`${endpoint}/${pointId}/`)

      if (isTotem) {
        setTotems(totems.filter((t) => t.id !== pointId))
      } else {
        setReceptions(receptions.filter((r) => r.id !== pointId))
      }

      handleCloseModal()
    } catch (error: any) {
      console.error("Error deleting point:", error)
      if (error.response?.status === 404) {
        if (isTotem) {
          setTotems(totems.filter((t) => t.id !== pointId))
        } else {
          setReceptions(receptions.filter((r) => r.id !== pointId))
        }
        handleCloseModal()
      } else {
        const errorMessage = error.response?.data?.detail || "No se pudo eliminar el punto."
        setError(errorMessage)
      }
    }
  }

  const handleGoHome = () => {
    navigate("/home")
  }

  const savePath = () => {
    if (currentPathPoints.length < 2) {
      setWarningMessage("El camino debe tener al menos dos puntos.")
      setWarningModalOpen(true)
      return
    }

    const firstPoint = currentPathPoints[0]
    const lastPoint = currentPathPoints[currentPathPoints.length - 1]

    const isFirstPointTotem = totems.some(
      (t) => Math.abs(t.latitude - firstPoint[0]) < 0.0001 && Math.abs(t.longitude - firstPoint[1]) < 0.0001,
    )

    if (!isFirstPointTotem) {
      setWarningMessage("El camino debe comenzar en un Tótem QR.")
      setWarningModalOpen(true)
      return
    }

    const isLastPointReception = receptions.some(
      (r) => Math.abs(r.latitude - lastPoint[0]) < 0.0001 && Math.abs(r.longitude - lastPoint[1]) < 0.0001,
    )

    if (!isLastPointReception) {
      setWarningMessage("El camino debe terminar en un Espacio Seguro (Recepción QR).")
      setWarningModalOpen(true)
      return
    }

    setIsConfirmModalOpen(true)
    setPathSaved(false)
  }

  const confirmSavePath = async () => {
    if (!["admin", "superuser"].includes(role as string)) {
      setError("Solo administradores pueden guardar caminos.")
      setIsConfirmModalOpen(false)
      return
    }
    const trimmedName = pathName.trim()
    if (!trimmedName || trimmedName.length < 3) {
      setError("Por favor, ingresa un nombre válido para el camino (mínimo 3 caracteres).")
      return
    }
    const pathData = {
      name: trimmedName,
      points: currentPathPoints.map((point, index) => ({
        latitude: point[0],
        longitude: point[1],
        order: index + 1,
      })),
      campus: campus || "",
    }

    try {
      const response = await axiosInstance.post("caminos/", pathData)
      setPaths((prev: Path[]) => [...prev, response.data as Path])
      setCurrentPathPoints([])
      setIsCreatingPath(false)
      setPathSaved(true)
      setPathName("")
    } catch (error: any) {
      console.error("Error saving path:", error)
      const errorMessage = error.response?.data?.detail || "No se pudo guardar el camino."
      setError(errorMessage)
      setIsConfirmModalOpen(false)
      setPathName("")
    }
  }

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setPathName("")
    setPathSaved(false)
    setCurrentPathPoints([])
  }

  const handleCreateAnotherPath = () => {
    setPathSaved(false)
    setPathName("")
    setCurrentPathPoints([])
    setIsCreatingPath(true)
    setIsConfirmModalOpen(false)
  }

  const toggleShowPaths = () => {
    setShowPaths(!showPaths)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handlePathClick = (path: Path) => {
    if (!["admin", "superuser"].includes(role as string)) return
    setSelectedPath(path)
    setIsPathModalOpen(true)
  }

  const handleDeletePath = async (pathId: number | undefined) => {
    if (!pathId || !["admin", "superuser"].includes(role as string)) return

    try {
      await deletePath(pathId)
      setPaths(paths.filter((p) => p.id !== pathId))
      setIsPathModalOpen(false)
      setSelectedPath(null)
    } catch (error: any) {
      console.error("Error deleting path:", error)
      setError("No se pudo eliminar el camino.")
    }
  }

  // Funciones para el reporte de atención
  const handleReportInputChange = (field: string, value: string) => {
    setReportData((prev) => ({ ...prev, [field]: value }))
  }

  const handleReportCheckboxChange = (motivo: string, checked: boolean) => {
    setReportData((prev) => ({
      ...prev,
      motivos: { ...prev.motivos, [motivo]: checked },
    }))
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!reportData.nombre.trim() || !reportData.email.trim()) {
      setError("Por favor complete los campos obligatorios (nombre y email).")
      return
    }

    // Verificar que al menos un motivo esté seleccionado
    const motivosSeleccionados = Object.values(reportData.motivos).some((motivo) => motivo)
    if (!motivosSeleccionados) {
      setError("Por favor seleccione al menos un motivo.")
      return
    }

    setReportLoading(true)
    setError(null)

    try {
      // Preparar datos para envío
      const reportPayload = {
        nombre: reportData.nombre.trim(),
        email: reportData.email.trim(),
        telefono: reportData.telefono.trim(),
        motivos_no_atencion: Object.entries(reportData.motivos)
          .filter(([_, selected]) => selected)
          .map(([motivo, _]) => motivo),
        comentarios: reportData.comentarios.trim(),
        campus: reportData.campus,
        tipo_reporte: "falta_atencion",
      }

      console.log("Enviando reporte de atención:", reportPayload)

      // Enviar reporte al backend

      const response = await createAttentionReport(reportPayload);

      console.log("Reporte enviado exitosamente:", response.data)
      setReportSubmitted(true)

      // Reset del formulario
      setReportData({
        nombre: "",
        email: "",
        telefono: "",
        motivos: {
          noHabiaPersonal: false,
          oficinaCerrada: false,
          largoTiempoEspera: false,
          personalOcupado: false,
          otro: false,
        },
        comentarios: "",
        campus: campus || "",
      })
    } catch (error: any) {
      console.error("Error al enviar reporte:", error)
      if (error.response?.data) {
        const serverErrors = error.response.data
        if (typeof serverErrors === "object") {
          const errorMessages = Object.values(serverErrors).flat().join(", ")
          setError(`Error al enviar el reporte: ${errorMessages}`)
        } else {
          setError(`Error al enviar el reporte: ${serverErrors}`)
        }
      } else {
        setError("Error al enviar el reporte. Por favor, intente nuevamente.")
      }
    } finally {
      setReportLoading(false)
    }
  }

  const handleReportReset = () => {
    setReportSubmitted(false)
    setError(null)
  }

  if (loading) {
    return <Typography>Validando sesión...</Typography>
  }

  if (isAuthenticated === false) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate("/")}>
          Iniciar Sesión
        </Button>
      </Box>
    )
  }

  if (!role || !["admin", "user", "guest", "superuser"].includes(role)) {
    return <Typography>Acceso denegado. Por favor, inicia sesión.</Typography>
  }

  const { src: mapaSrc, error: mapaError } = getMapaSrc(campus)

  return (
    <Box className="openmap-container">
      {(error || svgError || mapaError) && (
        <Typography className="openmap-error">{error || svgError || mapaError}</Typography>
      )}
      <Tabs value={tabValue} onChange={handleTabChange} centered className="openmap-tabs">
        <Tab label="Mapa" />
        <Tab label="Entrevista" />
        <Tab label="Reporte de Atención" />
      </Tabs>

      {tabValue === 0 && (
        <Box className="openmap-map-container">
          {mapaSrc ? (
            <MapComponent
              campus={campus || ""}
              totems={totems}
              receptions={receptions}
              paths={paths}
              showPaths={showPaths}
              isCreatingPath={isCreatingPath}
              isCreatingTotem={isCreatingTotem}
              isCreatingReception={isCreatingReception}
              currentPathPoints={currentPathPoints}
              setCurrentPathPoints={setCurrentPathPoints}
              setSelectedPoint={setSelectedPoint}
              setIsModalOpen={setIsModalOpen}
              role={role}
              mapaSrc={mapaSrc}
              onCreateTotem={handleCreateTotem}
              onCreateReception={handleCreateReception}
              initialPoint={initialPoint}
              setWarningMessage={setWarningMessage}
              setWarningModalOpen={setWarningModalOpen}
              onPathClick={handlePathClick}
              showPointNames={showPointNames}
            />
          ) : (
            <Box className="openmap-error">
              <Typography>No se encontró un mapa para el campus seleccionado.</Typography>
              <Button variant="contained" color="primary" onClick={() => navigate("/home")}>
                Volver a la página principal
              </Button>
            </Box>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box className="openmap-form-container">
          <FormComponent
            campus={campus}
            setSubmitted={setSubmitted}
            setFormErrors={setFormErrors}
            setError={setError}
          />
          {submitted && (
            <Box sx={{ textAlign: "center", mt: 10 }}>
              <Typography variant="h5">Entrevista de acogida enviada</Typography>
              <Button variant="contained" onClick={() => setSubmitted(false)} className="openmap-form-button">
                Realizar otra entrevista
              </Button>
            </Box>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box className="openmap-report-container">
          {!reportSubmitted ? (
            <Box className="openmap-report-form">
              <Box className="openmap-report-header">
                <Typography className="openmap-report-title">Reporte de Falta de Atención</Typography>
                <Typography className="openmap-report-subtitle">
                  Si no encontró personal disponible para atenderle o tuvo problemas con la atención, por favor complete
                  este formulario para ayudarnos a mejorar nuestro servicio.
                </Typography>
              </Box>

              <form onSubmit={handleReportSubmit}>
                <Box className="openmap-report-section">
                  <Typography className="openmap-report-section-title">
                    <ReportIcon />
                    Información de Contacto
                  </Typography>

                  <Box className="openmap-report-field">
                    <TextField
                      label="Nombre Completo"
                      value={reportData.nombre}
                      onChange={(e) => handleReportInputChange("nombre", e.target.value)}
                      fullWidth
                      required
                      placeholder="Ingrese su nombre completo"
                    />
                  </Box>

                  <Box className="openmap-report-field">
                    <TextField
                      label="Correo Electrónico"
                      type="email"
                      value={reportData.email}
                      onChange={(e) => handleReportInputChange("email", e.target.value)}
                      fullWidth
                      required
                      placeholder="ejemplo@correo.com"
                    />
                  </Box>

                  <Box className="openmap-report-field">
                    <TextField
                      label="Teléfono (Opcional)"
                      value={reportData.telefono}
                      onChange={(e) => handleReportInputChange("telefono", e.target.value)}
                      fullWidth
                      placeholder="+56 9 1234 5678"
                    />
                  </Box>
                </Box>

                <Box className="openmap-report-section">
                  <Typography className="openmap-report-section-title">Motivo de la Falta de Atención</Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: "#64748b" }}>
                    Seleccione todos los motivos que apliquen a su situación:
                  </Typography>

                  <FormGroup className="openmap-report-checkbox-group">
                    <Box
                      className={`openmap-report-checkbox-item ${reportData.motivos.noHabiaPersonal ? "checked" : ""}`}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportData.motivos.noHabiaPersonal}
                            onChange={(e) => handleReportCheckboxChange("noHabiaPersonal", e.target.checked)}
                          />
                        }
                        label="No había personal disponible en el lugar"
                      />
                    </Box>

                    <Box
                      className={`openmap-report-checkbox-item ${reportData.motivos.oficinaCerrada ? "checked" : ""}`}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportData.motivos.oficinaCerrada}
                            onChange={(e) => handleReportCheckboxChange("oficinaCerrada", e.target.checked)}
                          />
                        }
                        label="La oficina o espacio estaba cerrado"
                      />
                    </Box>

                    <Box
                      className={`openmap-report-checkbox-item ${reportData.motivos.largoTiempoEspera ? "checked" : ""}`}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportData.motivos.largoTiempoEspera}
                            onChange={(e) => handleReportCheckboxChange("largoTiempoEspera", e.target.checked)}
                          />
                        }
                        label="Tiempo de espera excesivamente largo"
                      />
                    </Box>

                    <Box
                      className={`openmap-report-checkbox-item ${reportData.motivos.personalOcupado ? "checked" : ""}`}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportData.motivos.personalOcupado}
                            onChange={(e) => handleReportCheckboxChange("personalOcupado", e.target.checked)}
                          />
                        }
                        label="El personal estaba ocupado y no pudo atenderme"
                      />
                    </Box>

                    <Box className={`openmap-report-checkbox-item ${reportData.motivos.otro ? "checked" : ""}`}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportData.motivos.otro}
                            onChange={(e) => handleReportCheckboxChange("otro", e.target.checked)}
                          />
                        }
                        label="Otro motivo (especificar en comentarios)"
                      />
                    </Box>
                  </FormGroup>
                </Box>

                <Box className="openmap-report-section">
                  <Typography className="openmap-report-section-title">Comentarios Adicionales</Typography>

                  <Box className="openmap-report-field">
                    <TextField
                      label="Comentarios"
                      multiline
                      rows={4}
                      value={reportData.comentarios}
                      onChange={(e) => handleReportInputChange("comentarios", e.target.value)}
                      fullWidth
                      placeholder="Describa con más detalle su experiencia o cualquier información adicional que considere relevante..."
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={reportLoading}
                  className="openmap-report-submit-button"
                >
                  {reportLoading ? (
                    <Box className="openmap-report-loading">
                      <Box className="openmap-report-loading-spinner" />
                      Enviando reporte...
                    </Box>
                  ) : (
                    "Enviar Reporte de Atención"
                  )}
                </Button>
              </form>
            </Box>
          ) : (
            <Box className="openmap-report-success">
              <Typography className="openmap-report-success-title">¡Reporte Enviado Exitosamente!</Typography>
              <Typography className="openmap-report-success-message">
                Gracias por reportar esta situación. Su reporte ha sido registrado y será revisado por nuestro equipo
                para mejorar la calidad de atención en nuestros espacios seguros.
              </Typography>
              <Button
                variant="contained"
                onClick={handleReportReset}
                sx={{ mt: 3, backgroundColor: "#16a34a", "&:hover": { backgroundColor: "#15803d" } }}
              >
                Enviar Otro Reporte
              </Button>
            </Box>
          )}
        </Box>
      )}

      <Box className="openmap-buttons-container">
        <Tooltip title="Volver a la página principal">
          <Button
            onClick={handleGoHome}
            variant="contained"
            color="primary"
            className="openmap-button"
            aria-label="Volver a la página principal"
          >
            <HomeIcon />
          </Button>
        </Tooltip>
        {["admin", "superuser"].includes(role as string) && (
          <>
            <Tooltip title={isCreatingPath ? "Cancelar Crear Camino" : "Crear Camino"}>
              <Button
                onClick={() => {
                  if (isCreatingPath) {
                    setIsCreatingPath(false)
                    setCurrentPathPoints([])
                    setPathName("")
                  } else {
                    setIsCreatingPath(true)
                  }
                }}
                disabled={isCreatingTotem || isCreatingReception}
                variant="contained"
                color={isCreatingPath ? "secondary" : "primary"}
                className="openmap-button"
                aria-label={isCreatingPath ? "Cancelar Crear Camino" : "Crear Camino"}
              >
                {isCreatingPath ? <CancelIcon /> : <RouteIcon />}
              </Button>
            </Tooltip>
            <Tooltip title={showPointNames ? "Ocultar Nombres de Puntos" : "Mostrar Nombres de Puntos"}>
              <Button
                onClick={() => setShowPointNames(!showPointNames)}
                variant="contained"
                color={showPointNames ? "secondary" : "primary"}
                className="openmap-button"
                aria-label={showPointNames ? "Ocultar Nombres de Puntos" : "Mostrar Nombres de Puntos"}
              >
                {showPointNames ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </Button>
            </Tooltip>

            {isCreatingPath && (
              <Tooltip title="Guardar Camino">
                <Button
                  onClick={savePath}
                  variant="contained"
                  color="success"
                  className="openmap-button"
                  aria-label="Guardar Camino"
                >
                  <SaveIcon />
                </Button>
              </Tooltip>
            )}

            <Tooltip title={isCreatingTotem ? "Cancelar Crear Punto QR" : "Crear Punto QR"}>
              <Button
                onClick={() => setIsCreatingTotem(!isCreatingTotem)}
                disabled={isCreatingPath || isCreatingReception}
                variant="contained"
                color={isCreatingTotem ? "secondary" : "primary"}
                className="openmap-button"
                aria-label={isCreatingTotem ? "Cancelar Crear Punto QR" : "Crear Punto QR"}
              >
                {isCreatingTotem ? <CancelIcon /> : <QrCodeIcon />}
              </Button>
            </Tooltip>

            <Tooltip title={isCreatingReception ? "Cancelar Espacio Seguro" : "Crear Espacio Seguro"}>
              <Button
                onClick={() => setIsCreatingReception(!isCreatingReception)}
                disabled={isCreatingPath || isCreatingTotem}
                variant="contained"
                color={isCreatingReception ? "secondary" : "primary"}
                className="openmap-button"
                aria-label={isCreatingReception ? "Cancelar Espacio Seguro" : "Crear Espacio Seguro"}
              >
                {isCreatingReception ? <CancelIcon /> : <ShieldIcon />}
              </Button>
            </Tooltip>
          </>
        )}

        <Tooltip title={showPaths ? "Ocultar Caminos" : "Mostrar Caminos"}>
          <Button
            onClick={toggleShowPaths}
            variant="contained"
            color={showPaths ? "secondary" : "primary"}
            className="openmap-button"
            aria-label={showPaths ? "Ocultar Caminos" : "Mostrar Caminos"}
          >
            {showPaths ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </Button>
        </Tooltip>
      </Box>

      <InfoPunto
        open={isModalOpen}
        punto={selectedPoint}
        role={role}
        onClose={handleCloseModal}
        onSave={handleSavePoint}
        onDelete={handleDeletePoint}
        setImageFiles={setImageFiles}
      />

      <Dialog open={isConfirmModalOpen} onClose={handleCloseConfirmModal}>
        <DialogTitle>{pathSaved ? "Camino Guardado" : "Guardar Camino"}</DialogTitle>
        <DialogContent>
          {pathSaved ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" color="success.main">
                ¡Camino guardado exitosamente!
              </Typography>
              <Typography>El camino "{pathName || "Nuevo Camino"}" ha sido creado y añadido al mapa.</Typography>
            </Box>
          ) : (
            <TextField
              fullWidth
              label="Nombre del Camino"
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              margin="normal"
              required
              error={pathName.trim().length > 0 && pathName.trim().length < 3}
              helperText={
                pathName.trim().length > 0 && pathName.trim().length < 3
                  ? "El nombre debe tener al menos 3 caracteres."
                  : ""
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          {pathSaved ? (
            <>
              <Button onClick={handleCloseConfirmModal} color="primary">
                Cerrar
              </Button>
              <Button onClick={handleCreateAnotherPath} color="primary" variant="contained">
                Crear Otro Camino
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCloseConfirmModal} color="secondary">
                Cancelar
              </Button>
              <Button onClick={confirmSavePath} color="primary" disabled={pathName.trim().length < 3}>
                Guardar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={warningModalOpen} onClose={() => setWarningModalOpen(false)}>
        <DialogTitle>Advertencia</DialogTitle>
        <DialogContent>
          <Typography>{warningMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningModalOpen(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isPathModalOpen} onClose={() => setIsPathModalOpen(false)}>
        <DialogTitle>Eliminar Camino: {selectedPath?.name}</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar este camino?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPathModalOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={() => handleDeletePath(selectedPath?.id)} color="primary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OpenMap
