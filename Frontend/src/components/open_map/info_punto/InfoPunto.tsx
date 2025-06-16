import CloseIcon from "@mui/icons-material/Close"
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { es } from "date-fns/locale"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Slider from "react-slick"
import "slick-carousel/slick/slick-theme.css"
import "slick-carousel/slick/slick.css"
import axiosInstance from "../../../services/axiosInstance"
import type { ReceptionQR, TotemQR } from "../../../types/types"
import "./InfoPunto.css"

// Define LazyLoadTypes explicitly to avoid type mismatch
type LazyLoadTypes = "ondemand" | "progressive" | "anticipated"

// Define day schedule type
interface DaySchedule {
  openingTime: Date | null
  closingTime: Date | null
}

interface InfoPuntoProps {
  open: boolean
  punto: TotemQR | ReceptionQR | null
  role: string | null
  onClose: () => void
  onSave: (punto: TotemQR | ReceptionQR) => void
  onDelete: (pointId: number, isTotem: boolean) => void
  setImageFiles: (files: File[]) => void
}

const InfoPunto: React.FC<InfoPuntoProps> = ({ open, punto, role, onClose, onSave, onDelete, setImageFiles }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState<{ [key: string]: { enabled: boolean; time: string } } | null>(null)
  const [status, setStatus] = useState("Operativo")
  const [effectiveStatus, setEffectiveStatus] = useState("Operativo")
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [isDeleting, setIsDeleting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [openImageModal, setOpenImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [openingTime, setOpeningTime] = useState<Date | null>(null)
  const [closingTime, setClosingTime] = useState<Date | null>(null)
  const [selectedDays, setSelectedDays] = useState<boolean[]>([true, true, true, true, true, false, false])
  const [useUniformSchedule, setUseUniformSchedule] = useState(true)
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(Array(7).fill({ openingTime: null, closingTime: null }))

  const daysOfWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
  const isTotem = !!punto && !("schedule" in punto)
  const isEditable = role === "admin" || role === "superuser"
  const pointType = isTotem ? "totem" : "reception"

  const parseSchedule = (scheduleData: string | object) => {
    try {
      const scheduleObj = typeof scheduleData === "string" ? JSON.parse(scheduleData) : scheduleData
      const result: { opening: Date | null; closing: Date | null } = { opening: null, closing: null }
      const newDaySchedules = Array(7).fill({ openingTime: null, closingTime: null })
      const newSelectedDays = Array(7).fill(false)

      daysOfWeek.forEach((day, index) => {
        const key = day.toLowerCase()
        if (scheduleObj[key] && scheduleObj[key].enabled) {
          newSelectedDays[index] = true
          const [openTime, closeTime] = scheduleObj[key].time.split(" - ")
          newDaySchedules[index] = {
            openingTime: setTimeFromString(openTime),
            closingTime: setTimeFromString(closeTime),
          }
          if (!result.opening && !result.closing) {
            result.opening = newDaySchedules[index].openingTime
            result.closing = newDaySchedules[index].closingTime
          }
        }
      })

      setSelectedDays(newSelectedDays)
      setDaySchedules(newDaySchedules)
      setUseUniformSchedule(
        newDaySchedules.every((ds, i) =>
          !newSelectedDays[i] ||
          (ds.openingTime?.getTime() === newDaySchedules[0].openingTime?.getTime() &&
            ds.closingTime?.getTime() === newDaySchedules[0].closingTime?.getTime())
        )
      )
      return result
    } catch (error) {
      console.error("Error parsing schedule:", error)
      return { opening: null, closing: null }
    }
  }

  const setTimeFromString = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  const isWithinSchedule = () => {
    if (!punto || isTotem) return punto?.status === "Operativo"
    const scheduleData = "schedule" in punto ? (punto as ReceptionQR).schedule : null
    if (!scheduleData) return false

    const now = new Date()
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1
    const currentTime = now.getHours() * 60 + now.getMinutes()

    try {
      const scheduleObj = typeof scheduleData === "string" ? JSON.parse(scheduleData) : scheduleData
      const dayKey = daysOfWeek[currentDay].toLowerCase()
      if (!scheduleObj[dayKey]?.enabled) return false
      const [openTime, closeTime] = scheduleObj[dayKey].time.split(" - ")
      const opening = setTimeFromString(openTime)
      const closing = setTimeFromString(closeTime)
      const openingTime = opening.getHours() * 60 + opening.getMinutes()
      const closingTime = closing.getHours() * 60 + closing.getMinutes()
      if (closingTime < openingTime) {
        return currentTime >= openingTime || currentTime <= closingTime
      }
      return currentTime >= openingTime && currentTime <= closingTime
    } catch (error) {
      console.error("Error checking schedule:", error)
      return false
    }
  }

  const updateEffectiveStatus = () => {
    if (isTotem || !punto) {
      setEffectiveStatus(punto?.status || "Operativo")
      return
    }
    setEffectiveStatus(isWithinSchedule() ? "Operativo" : "No Operativo")
  }

  const checkImageUrl = (url: string) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        if (img.width > 0 && img.height > 0) {
          resolve(true)
        } else {
          console.warn(`Imagen con dimensiones inválidas: ${url}`)
          resolve(false)
        }
      }
      img.onerror = () => {
        console.warn(`Error al cargar la imagen: ${url}`)
        resolve(false)
      }
      img.crossOrigin = "anonymous"
      img.src = url
    })
  }

  useEffect(() => {
    if (punto && open) {
      setName(punto.name)
      setDescription(punto.description || "")
      const scheduleData = "schedule" in punto ? (punto as ReceptionQR).schedule : null
      if (scheduleData) {
        if (typeof scheduleData === "object" && scheduleData !== null) {
          setSchedule(scheduleData as any)
          const { opening, closing } = parseSchedule(JSON.stringify(scheduleData)) // Convertir a cadena para parseSchedule
        } else if (typeof scheduleData === "string" && scheduleData) {
          try {
            const parsed = JSON.parse(scheduleData)
            setSchedule(parsed)
            const { opening, closing } = parseSchedule(scheduleData)
            setOpeningTime(opening)
            setClosingTime(closing)
          } catch {
            setSchedule(null)
            setOpeningTime(null)
            setClosingTime(null)
          }
        } else {
          setSchedule(null)
          setOpeningTime(null)
          setClosingTime(null)
        }
      } else {
        setSchedule(null)
        setOpeningTime(null)
        setClosingTime(null)
        setSelectedDays([true, true, true, true, true, false, false])
        setDaySchedules(Array(7).fill({ openingTime: null, closingTime: null }))
        setUseUniformSchedule(true)
      }
      setStatus(punto.status || "Operativo")
      updateEffectiveStatus()
      setQrImage(punto.qr_image || null)
      setErrors({})
      setIsEditing(false)
      fetchImages()
    }
  }, [punto, open])

  useEffect(() => {
    if (!open) {
      // Limpia el foco cuando se cierra el Drawer
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [open]);


  useEffect(() => {
    updateEffectiveStatus()
    const interval = setInterval(updateEffectiveStatus, 60 * 1000)
    return () => clearInterval(interval)
  }, [punto, isEditing, selectedDays])

  useEffect(() => {
    const checkScrollable = () => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight } = contentRef.current
        setIsScrollable(scrollHeight > clientHeight)
      }
    }
    checkScrollable()
    window.addEventListener("resize", checkScrollable)
    return () => window.removeEventListener("resize", checkScrollable)
  }, [isEditing, images, newImagePreviews, qrImage])

  useEffect(() => {
    if (punto && open && typeof punto.id === "number") {
      fetchImages()
    }
  }, [punto, open])

  const updateScheduleFromTimePickers = useCallback(() => {
    if (!isEditing) return

    const formatTime = (date: Date | null) =>
      date ? date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }) : ""

    if (!selectedDays.some((day) => day)) {
      setSchedule(null)
      return
    }

    const newScheduleObj: any = {}
    let hasValidSchedule = false

    if (useUniformSchedule) {
      if (openingTime && closingTime) {
        const timeStr = `${formatTime(openingTime)} - ${formatTime(closingTime)}`
        daysOfWeek.forEach((day, index) => {
          newScheduleObj[day.toLowerCase()] = {
            enabled: selectedDays[index],
            time: selectedDays[index] ? timeStr : "",
          }
          if (selectedDays[index]) hasValidSchedule = true
        })
        setSchedule(hasValidSchedule ? newScheduleObj : null)
        setDaySchedules(
          selectedDays.map((enabled) => (enabled ? { openingTime, closingTime } : { openingTime: null, closingTime: null }))
        )
      }
    } else {
      daysOfWeek.forEach((day, index) => {
        const ds = daySchedules[index]
        if (selectedDays[index] && ds.openingTime && ds.closingTime) {
          const timeStr = `${formatTime(ds.openingTime)} - ${formatTime(ds.closingTime)}`
          newScheduleObj[day.toLowerCase()] = { enabled: true, time: timeStr }
          hasValidSchedule = true
        } else {
          newScheduleObj[day.toLowerCase()] = { enabled: selectedDays[index], time: "" }
        }
      })
      setSchedule(hasValidSchedule ? newScheduleObj : null)
    }
  }, [isEditing, openingTime, closingTime, selectedDays, useUniformSchedule, daySchedules])

  useEffect(() => {
    updateScheduleFromTimePickers()
  }, [updateScheduleFromTimePickers])

  const fetchImages = async () => {
    if (!punto) return
    try {
      const config: any = {
        params: {
          point_id: punto.id,
          point_type: pointType,
          campus: punto.campus,
        },
      }

      if (role !== "guest" && localStorage.getItem("access_token")) {
        config.headers = {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        }
      }

      const response = await axiosInstance.get("/images/", config)
      const fetchedImages = response.data.map((img: any) => img.image)
      const validImages = []
      for (const imgUrl of fetchedImages) {
        const isValid = await checkImageUrl(imgUrl)
        if (isValid) {
          validImages.push(imgUrl)
        } else {
          console.warn(`Imagen no válida o no accesible: ${imgUrl}`)
        }
      }
      setImages(validImages)
      console.log("Imágenes cargadas y verificadas:", validImages)
    } catch (error) {
      console.error("Error fetching images:", error)
    }
  }

  const validate = () => {
    const newErrors: { name?: string } = {}
    if (!name || name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerateQr = async () => {
    if (!punto) return
    setLoadingQr(true)
    setQrError(null)
    try {
      const endpoint = isTotem ? "totems" : "recepciones"
      const response = await axiosInstance.post(
        `${endpoint}/${punto.id}/generate_qr/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }
      )
      setQrImage(response.data.qr_image)
    } catch (err: any) {
      setQrError("No se pudo generar el código QR.")
    } finally {
      setLoadingQr(false)
    }
  }

  const handleDrawerClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Puedes agregar lógica específica para el backdrop click aquí si es necesario
    onClose();
  };

  const handleDownloadQr = () => {
    if (qrImage && punto) {
      const link = document.createElement("a")
      link.href = qrImage
      link.download = `qr_${pointType}_${punto.id}.png`
      link.click()
    }
  }

  const handleSave = async () => {
    if (!punto || !validate()) return

    const validStatus = status === 'Operativo' ? 'Operativo' : 'No Operativo';

    const updatedPoint = {
      name: name.trim(),
      description: description.trim(),
      validStatus,
      schedule: isTotem ? undefined : schedule || {},
      qr_image: qrImage,
    }

    try {
      const response = await axiosInstance.patch(`/${isTotem ? "totems" : "recepciones"}/${punto.id}/`, updatedPoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      const files = Array.from((document.querySelector('input[type="file"]') as HTMLInputElement)?.files || [])
      if (files.length > 0) {
        const formData = new FormData()
        files.forEach((file) => formData.append("file", file))
        formData.append("point_id", punto.id.toString())
        formData.append("point_type", isTotem ? "totem" : "reception")
        formData.append("campus", punto.campus || "")

        await axiosInstance.post("/images/", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data",
          },
        })
      }

      onSave(response.data)
      await fetchImages()
      setImageFiles(files)
      setNewImagePreviews([])
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving point:", error)
      setErrors({ name: "Error al guardar los cambios. Inténtalo de nuevo." })
    }
  }

  const handleCancel = () => {
    if (punto) {
      setName(punto.name)
      setDescription(punto.description || "")
      const scheduleData = "schedule" in punto ? (punto as ReceptionQR).schedule : null
      if (scheduleData) {
        if (typeof scheduleData === "object" && scheduleData !== null) {
          setSchedule(scheduleData as any)
          const { opening, closing } = parseSchedule(JSON.stringify(scheduleData))
          setOpeningTime(opening)
          setClosingTime(closing)
        } else if (typeof scheduleData === "string" && scheduleData) {
          try {
            const parsed = JSON.parse(scheduleData)
            setSchedule(parsed)
            const { opening, closing } = parseSchedule(scheduleData)
            setOpeningTime(opening)
            setClosingTime(closing)
          } catch {
            setSchedule(null)
            setOpeningTime(null)
            setClosingTime(null)
          }
        } else {
          setSchedule(null)
          setOpeningTime(null)
          setClosingTime(null)
        }
      } else {
        setSchedule(null)
        setOpeningTime(null)
        setClosingTime(null)
        setSelectedDays([true, true, true, true, true, false, false])
        setDaySchedules(Array(7).fill({ openingTime: null, closingTime: null }))
        setUseUniformSchedule(true)
      }
      setStatus(punto.status || "Operativo")
      updateEffectiveStatus()
      setQrImage(punto.qr_image || null)
      setErrors({})
      setNewImagePreviews([])
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (punto) {
      setIsDeleting(true)
      onDelete(punto.id, isTotem)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)
      setImageFiles(files)
      const previews = files.map((file) => URL.createObjectURL(file))
      setNewImagePreviews(previews)
      console.log("Previsualizaciones generadas:", previews)
    }
  }

  const handleDayChange = (index: number) => {
    setSelectedDays((prev) => {
      const newSelectedDays = [...prev]
      newSelectedDays[index] = !newSelectedDays[index]
      return newSelectedDays
    })
  }

  const handleDayScheduleChange = (index: number, field: "openingTime" | "closingTime", value: Date | null) => {
    setDaySchedules((prev) => {
      const newDaySchedules = [...prev]
      newDaySchedules[index] = { ...newDaySchedules[index], [field]: value }
      return newDaySchedules
    })
  }

  const sliderSettings = {
    dots: true,
    infinite: images.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: false,
    autoplay: false,
    pauseOnHover: true,
    cssEase: "ease-in-out",
    dotsClass: "slick-dots custom-dots",
    lazyLoad: "ondemand" as LazyLoadTypes,
    fade: true,
    customPaging: () => (
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "#bbb",
          display: "inline-block",
          margin: "0 4px",
        }}
      />
    ),
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleDrawerClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: "400px", md: "450px" },
            boxSizing: "border-box",
            boxShadow: "-4px 0 12px rgba(0, 0, 0, 0.1)",
            height: "100%",
            overflowY: "auto",
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0)",
          },
        }}
        ModalProps={{
          keepMounted: false, // Evita que se mantengan en el DOM cuando está cerrado
          disableRestoreFocus: true, // Evita problemas con el foco
        }}
        className="info-punto-drawer"
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderBottom: "1px solid #e0e0e0",
              backgroundColor: "#f9f5ff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {punto ? `${isTotem ? "Tótem QR" : "Espacio Seguro"}` : "Información del Punto"}
            </Typography>
            <IconButton onClick={onClose} aria-label="Cerrar">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            ref={contentRef}
            sx={{
              padding: "20px",
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            {punto ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {isEditing ? (
                  <>
                    {images.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Imágenes existentes:
                        </Typography>
                        <Box className="carousel-container">
                          {images.length > 1 && (
                            <Typography component="div" className="image-count">
                              {`${images.length} imágenes`}
                            </Typography>
                          )}
                          <Slider {...sliderSettings}>
                            {images.map((url, index) => (
                              <Box key={url || `image-${index}`} className="carousel-image-container">
                                <Box
                                  className="carousel-image-wrapper"
                                  tabIndex={-1} // Evita que sea enfocable
                                >
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`Imagen ${index + 1}`}
                                    className="carousel-image"
                                    onClick={() => {
                                      setSelectedImage(url)
                                      setOpenImageModal(true)
                                    }}
                                    tabIndex={open ? 0 : -1} // Solo enfocable cuando el Drawer está abierto
                                  />
                                </Box>
                              </Box>
                            ))}
                          </Slider>
                        </Box>
                      </Box>
                    ) : (
                      <Box className="no-images-placeholder" sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>
                          No hay imágenes disponibles
                        </Typography>
                      </Box>
                    )}
                    {newImagePreviews.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Nuevas imágenes:
                        </Typography>
                        <div className="carousel-container">
                          {newImagePreviews.length > 1 && (
                            <div className="image-count">{`${newImagePreviews.length} imágenes`}</div>
                          )}
                          <Slider {...sliderSettings}>
                            {newImagePreviews.map((preview, index) => (
                              <div key={preview || `preview-${index}`} className="carousel-image-container">
                                <div className="carousel-image-wrapper">
                                  <img
                                    src={preview || "/placeholder.svg"}
                                    alt={`Nueva imagen ${index + 1}`}
                                    className="carousel-image"
                                    onClick={() => {
                                      setSelectedImage(preview)
                                      setOpenImageModal(true)
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </Slider>
                        </div>
                      </Box>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      style={{ marginTop: "16px", marginBottom: "16px" }}
                    />
                    {isEditable && (
                      <Box className="qr-container" sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Código QR
                        </Typography>
                        {qrError && (
                          <Typography color="error" sx={{ mb: 1 }}>
                            {qrError}
                          </Typography>
                        )}
                        {qrImage ? (
                          <Box className="qr-image-container">
                            <img
                              src={qrImage || "/placeholder.svg"}
                              alt={`Código QR para ${punto.name}`}
                              className="qr-image"
                              onClick={() => {
                                setSelectedImage(qrImage)
                                setOpenImageModal(true)
                              }}
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleDownloadQr}
                              disabled={loadingQr}
                              sx={{ mt: 1, borderRadius: "8px", textTransform: "none" }}
                            >
                              Descargar QR
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGenerateQr}
                            disabled={loadingQr}
                            sx={{ borderRadius: "8px", textTransform: "none" }}
                          >
                            Generar QR
                          </Button>
                        )}
                      </Box>
                    )}
                    <TextField
                      label="Nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      required
                      error={!!errors.name}
                      helperText={errors.name}
                      sx={{ mt: 2 }}
                    />
                    <TextField
                      label="Descripción"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 2 }}
                    />
                    {!isTotem && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Horario:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Días de operación:
                          </Typography>
                          <Box className="days-checkbox-group">
                            {daysOfWeek.map((day, index) => (
                              <FormControlLabel
                                key={day}
                                control={
                                  <Checkbox
                                    checked={selectedDays[index]}
                                    onChange={() => handleDayChange(index)}
                                  />
                                }
                                label={day}
                              />
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <Typography variant="body2" sx={{ mr: 2 }}>
                            Usar horario uniforme
                          </Typography>
                          <Switch
                            checked={useUniformSchedule}
                            onChange={() => setUseUniformSchedule(!useUniformSchedule)}
                          />
                        </Box>
                        {useUniformSchedule ? (
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                              <TimePicker
                                label="Hora de apertura"
                                value={openingTime}
                                onChange={(newValue) => setOpeningTime(newValue)}
                                sx={{ flex: 1 }}
                              />
                              <TimePicker
                                label="Hora de cierre"
                                value={closingTime}
                                onChange={(newValue) => setClosingTime(newValue)}
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </LocalizationProvider>
                        ) : (
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            {daysOfWeek.map((day, index) =>
                              selectedDays[index] ? (
                                <Box key={day} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {day}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                    <TimePicker
                                      label="Hora de apertura"
                                      value={daySchedules[index].openingTime}
                                      onChange={(newValue) =>
                                        handleDayScheduleChange(index, "openingTime", newValue)
                                      }
                                      sx={{ flex: 1 }}
                                    />
                                    <TimePicker
                                      label="Hora de cierre"
                                      value={daySchedules[index].closingTime}
                                      onChange={(newValue) =>
                                        handleDayScheduleChange(index, "closingTime", newValue)
                                      }
                                      sx={{ flex: 1 }}
                                    />
                                  </Box>
                                </Box>
                              ) : null
                            )}
                          </LocalizationProvider>
                        )}
                      </Box>
                    )}
                    <TextField
                      label="Estado"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      fullWidth
                      select
                      sx={{ mt: 2 }}
                    >
                      <MenuItem value="Operativo">Operativo</MenuItem>
                      <MenuItem value="No Operativo">No Operativo</MenuItem>
                    </TextField>
                  </>
                ) : (
                  <>
                    {images.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Imágenes:
                        </Typography>
                        <div className="carousel-container">
                          {images.length > 1 && <div className="image-count">{`${images.length} imágenes`}</div>}
                          <Slider {...sliderSettings}>
                            {images.map((url, index) => (
                              <div key={url || `image-${index}`} className="carousel-image-container">
                                <div className="carousel-image-wrapper">
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`Imagen ${index + 1}`}
                                    className="carousel-image"
                                    onClick={() => {
                                      setSelectedImage(url)
                                      setOpenImageModal(true)
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </Slider>
                        </div>
                      </Box>
                    ) : (
                      <Box className="no-images-placeholder" sx={{ mt: 4 }}>
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>
                          No hay imágenes disponibles
                        </Typography>
                      </Box>
                    )}
                    {qrImage && (
                      <Box className="qr-container" sx={{ mt: 4 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Código QR:
                        </Typography>
                        <Box className="qr-image-container">
                          <img
                            src={qrImage || "/placeholder.svg"}
                            alt={`Código QR para ${punto.name}`}
                            className="qr-image"
                            onClick={() => {
                              setSelectedImage(qrImage)
                              setOpenImageModal(true)
                            }}
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDownloadQr}
                            sx={{ mt: 1, borderRadius: "8px", textTransform: "none" }}
                          >
                            Descargar QR
                          </Button>
                        </Box>
                      </Box>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 4, mb: 0.5, color: "text.secondary" }}>
                      Nombre:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {punto.name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: "text.secondary" }}>
                      Descripción:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {punto.description || "No hay descripción disponible."}
                    </Typography>
                    {!isTotem && (
                      <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: "text.secondary" }}>
                          Horario:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {"schedule" in punto && punto.schedule ? (
                            typeof punto.schedule === "object" && punto.schedule !== null ? (
                              <Box component="ul" sx={{ pl: 2 }}>
                                {daysOfWeek.map((day, index) => {
                                  const dayKey = day.toLowerCase()
                                  const daySchedule = (punto.schedule as any)[dayKey]
                                  if (daySchedule?.enabled) {
                                    return (
                                      <Typography key={day} variant="body2" component="li">
                                        {`${day}: ${daySchedule.time}`}
                                      </Typography>
                                    )
                                  }
                                  return null
                                })}
                              </Box>
                            ) : typeof punto.schedule === "string" && punto.schedule.startsWith("{") ? (
                              <Box component="ul" sx={{ pl: 2 }}>
                                {daysOfWeek.map((day, index) => {
                                  try {
                                    const scheduleObj = JSON.parse(punto.schedule)
                                    const dayKey = day.toLowerCase()
                                    if (scheduleObj[dayKey]?.enabled) {
                                      return (
                                        <Typography key={day} variant="body2" component="li">
                                          {`${day}: ${scheduleObj[dayKey].time}`}
                                        </Typography>
                                      )
                                    }
                                    return null
                                  } catch {
                                    return null
                                  }
                                })}
                              </Box>
                            ) : (
                              <Typography variant="body1">{punto.schedule}</Typography>
                            )
                          ) : (
                            <Typography variant="body1">No hay horario disponible.</Typography>
                          )}
                        </Box>
                      </>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: "text.secondary" }}>
                      Estado:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, color: effectiveStatus === "Operativo" ? "green" : "red" }}>
                      {effectiveStatus}
                    </Typography>
                  </>
                )}
              </Box>
            ) : (
              <Typography>No hay información disponible.</Typography>
            )}
          </Box>

          <Box
            sx={{
              padding: "16px 24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#f9f5ff",
            }}
          >
            {isEditable && punto && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleCancel}
                      color="secondary"
                      variant="outlined"
                      sx={{ borderRadius: "8px", textTransform: "none" }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      color="primary"
                      variant="contained"
                      disabled={!name || name.trim().length < 2}
                      sx={{ borderRadius: "8px", textTransform: "none" }}
                    >
                      Guardar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      color="primary"
                      variant="contained"
                      sx={{ borderRadius: "8px", textTransform: "none" }}
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={handleDelete}
                      color="error"
                      variant="contained"
                      disabled={isDeleting}
                      sx={{ borderRadius: "8px", textTransform: "none" }}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </Drawer>

      <Dialog
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        maxWidth="xl"
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "rgba(0, 0,0.95)",
            boxShadow: "none",
            margin: 0,
            maxWidth: "100vw",
            maxHeight: "100vh",
            width: "100vw",
            height: "100vh",
            borderRadius: 0,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={() => setOpenImageModal(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Imagen ampliada"
              style={{
                maxWidth: "95%",
                maxHeight: "90%",
                objectFit: "contain",
                boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  )
}

export default InfoPunto