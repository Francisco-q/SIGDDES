import CloseIcon from "@mui/icons-material/Close"
import { Box, Button, Dialog, Drawer, IconButton, MenuItem, TextField, Typography } from "@mui/material"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { es } from "date-fns/locale"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import Slider from "react-slick"
import "slick-carousel/slick/slick-theme.css"
import "slick-carousel/slick/slick.css"
import axiosInstance from "../../../services/axiosInstance"
import type { ReceptionQR, TotemQR } from "../../../types/types"
import "./InfoPunto.css"

// Define LazyLoadTypes explicitly to avoid type mismatch
type LazyLoadTypes = "ondemand" | "progressive" | "anticipated"

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
  const [schedule, setSchedule] = useState("")
  const [status, setStatus] = useState("Operativo")
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

  const isTotem = !!punto && !("schedule" in punto)
  const isEditable = role === "admin" || role === "superuser"
  const pointType = isTotem ? "totem" : "reception"

  const parseSchedule = (scheduleStr: string) => {
    try {
      const regex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
      const match = scheduleStr.match(regex)
      if (match) {
        const [_, openTime, closeTime] = match

        const setTimeFromString = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(":").map(Number)
          const date = new Date()
          date.setHours(hours, minutes, 0, 0)
          return date
        }

        return {
          opening: setTimeFromString(openTime),
          closing: setTimeFromString(closeTime),
        }
      }
    } catch (error) {
      console.error("Error parsing schedule:", error)
    }
    return { opening: null, closing: null }
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
      const scheduleStr = "schedule" in punto ? (punto as ReceptionQR).schedule || "" : ""
      setSchedule(scheduleStr)

      if (scheduleStr) {
        const { opening, closing } = parseSchedule(scheduleStr)
        setOpeningTime(opening)
        setClosingTime(closing)
      } else {
        setOpeningTime(null)
        setClosingTime(null)
      }

      setStatus(punto.status || "Operativo")
      setQrImage(punto.qr_image || null)
      setErrors({})
      setIsEditing(false)
      fetchImages()
    }
  }, [punto, open])

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

  useEffect(() => {
    if (isEditing) {
      updateScheduleFromTimePickers()
    }
  }, [openingTime, closingTime, isEditing])

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

      const response = await axiosInstance.get("images/", config)

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

    const updatedPoint = {
      ...punto,
      name: name.trim(),
      description: description.trim(),
      status,
      ...(isTotem ? {} : { schedule: schedule.trim() }),
      imageUrls: images,
      qr_image: qrImage,
    }

    onSave(updatedPoint)
    setImageFiles(Array.from((document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement)?.files || []))
    await fetchImages()
    setNewImagePreviews([])
    setIsEditing(false)
  }

  const updateScheduleFromTimePickers = () => {
    if (openingTime && closingTime) {
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      }

      const newSchedule = `${formatTime(openingTime)} - ${formatTime(closingTime)}`
      setSchedule(newSchedule)
    }
  }

  const handleCancel = () => {
    if (punto) {
      setName(punto.name)
      setDescription(punto.description || "")
      const scheduleStr = "schedule" in punto ? (punto as ReceptionQR).schedule || "" : ""
      setSchedule(scheduleStr)

      if (scheduleStr) {
        const { opening, closing } = parseSchedule(scheduleStr)
        setOpeningTime(opening)
        setClosingTime(closing)
      } else {
        setOpeningTime(null)
        setClosingTime(null)
      }

      setStatus(punto.status || "Operativo")
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
    lazyLoad: "ondemand" as LazyLoadTypes, // Explicitly cast to LazyLoadTypes
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
        onClose={onClose}
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
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: "text.secondary" }}>
                          Imágenes existentes:
                        </Typography>
                        <div className="carousel-container">
                          {images.length > 1 && <div className="image-count">{`${images.length} imágenes`}</div>}
                          <Slider {...sliderSettings}>
                            {images.map((url, index) => (
                              <div key={url || `image-${index}`} className="carousel-image-container">
                                <div className="carousel-image-wrapper">
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`Imagen existente ${index + 1}`}
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
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                          Horario resultante: {schedule}
                        </Typography>
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
                      <Box className="no-images-placeholder" sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>
                          No hay imágenes disponibles
                        </Typography>
                      </Box>
                    )}
                    {qrImage && (
                      <Box className="qr-container" sx={{ mt: 2 }}>
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 2, mb: 0.5, color: "text.secondary" }}>
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
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {"schedule" in punto && punto.schedule ? punto.schedule : "No hay horario disponible."}
                        </Typography>
                      </>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: "text.secondary" }}>
                      Estado:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {punto.status}
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
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "rgba(0, 0, 0, 0.95)",
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
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
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
                boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  )
}

export default InfoPunto