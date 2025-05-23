import { Box, Tooltip } from "@mui/material";
import { useState } from "react";

// Paleta de colores predefinida para tipos de incidente
const colorMap: Record<string, { bg: string; hover: string; text: string }> = {
    Acoso: { bg: "#f44336", hover: "#d32f2f", text: "white" }, // Rojo
    Discriminación: { bg: "#3f51b5", hover: "#303f9f", text: "white" }, // Índigo
    Violencia: { bg: "#e91e63", hover: "#c2185b", text: "white" }, // Rosa
    "Necesito orientacion": { bg: "#009688", hover: "#00796b", text: "white" }, // Teal
    Hostigamiento: { bg: "#ff9800", hover: "#f57c00", text: "white" }, // Naranja
    Abuso: { bg: "#673ab7", hover: "#512da8", text: "white" }, // Púrpura
}

// Función para generar un color basado en el tipo (para tipos no predefinidos)
const getColorForTipo = (tipo: string): { bg: string; hover: string; text: string } => {
    if (colorMap[tipo]) {
        return colorMap[tipo]
    }
    // Generar un color basado en un hash simple para consistencia
    let hash = 0
    for (let i = 0; i < tipo.length; i++) {
        hash = tipo.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    const bg = `hsl(${hue}, 70%, 50%)`
    const hover = `hsl(${hue}, 80%, 40%)`
    return { bg, hover, text: "white" }
}

interface TipoBadgeProps {
    tipo: string
}

export default function TipoBadge({ tipo }: TipoBadgeProps) {
    const [isHovered, setIsHovered] = useState(false)
    const colors = getColorForTipo(tipo)

    // Si el texto es demasiado largo, lo mostramos truncado y con un tooltip
    const isTruncated = tipo.length > 12
    const displayText = isTruncated ? `${tipo.substring(0, 10)}...` : tipo

    return (
        <Tooltip title={isTruncated ? tipo : ""} arrow placement="top">
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 0.5,
                    px: 1.5,
                    borderRadius: "12px",
                    minWidth: 100,
                    maxWidth: 120,
                    backgroundColor: isHovered ? colors.hover : colors.bg,
                    color: colors.text,
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    textAlign: "center",
                    boxShadow: isHovered ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 1px 4px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease-in-out",
                    cursor: "default",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textTransform: "capitalize",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {displayText}
            </Box>
        </Tooltip>
    )
}
