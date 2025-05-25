"use client"

import { Box, Tooltip } from "@mui/material"
import { useState } from "react"
import "./TipoBadge.css"

// Mapeo de tipos a clases CSS
const typeToClass: Record<string, string> = {
    Acoso: "acoso",
    Discriminación: "discriminacion",
    Violencia: "violencia",
    "Necesito orientacion": "necesito-orientacion",
    Hostigamiento: "hostigamiento",
    Abuso: "abuso",
}

// Función para generar un color basado en el tipo (para tipos no predefinidos)
const getColorForTipo = (tipo: string): { bg: string; hover: string; text: string } => {
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
    size?: "small" | "medium" | "large"
    disabled?: boolean
}

export default function TipoBadge({ tipo, size = "medium", disabled = false }: TipoBadgeProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Si el texto es demasiado largo, lo mostramos truncado y con un tooltip
    const isTruncated = tipo.length > 12
    const displayText = isTruncated ? `${tipo.substring(0, 10)}...` : tipo

    // Determinar la clase CSS basada en el tipo
    const typeClass = typeToClass[tipo]
    const isCustomType = !typeClass

    // Para tipos personalizados, generar colores dinámicamente
    const customColors = isCustomType ? getColorForTipo(tipo) : null

    const badgeClasses = ["tipo-badge", typeClass || "custom", size !== "medium" ? size : "", disabled ? "disabled" : ""]
        .filter(Boolean)
        .join(" ")

    const badgeStyle = isCustomType
        ? {
            backgroundColor: isHovered ? customColors!.hover : customColors!.bg,
            color: customColors!.text,
        }
        : {}

    return (
        <Tooltip title={isTruncated ? tipo : ""} arrow placement="top" classes={{ tooltip: "tipo-badge-tooltip" }}>
            <Box
                className={badgeClasses}
                style={badgeStyle}
                onMouseEnter={() => !disabled && setIsHovered(true)}
                onMouseLeave={() => !disabled && setIsHovered(false)}
            >
                {displayText}
            </Box>
        </Tooltip>
    )
}
