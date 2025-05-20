import { Box } from "@mui/material";

// Paleta de colores predefinida para tipos de incidente
const colorMap: Record<string, string> = {
    'Acoso': '#f44336', // Rojo
    'Discriminación': '#3f51b5', // Índigo
    'Violencia': '#e91e63', // Rosa
    'Necesito orientacion': '#009688', // Teal
    'Hostigamiento': '#ff9800', // Naranja
    'Abuso': '#673ab7', // Púrpura
};

// Función para generar un color basado en el tipo (para tipos no predefinidos)
const getColorForTipo = (tipo: string): string => {
    if (colorMap[tipo]) {
        return colorMap[tipo];
    }
    // Generar un color basado en un hash simple para consistencia
    let hash = 0;
    for (let i = 0; i < tipo.length; i++) {
        hash = tipo.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 50%, 50%)`;
};

interface TipoBadgeProps {
    tipo: string;
}

export default function TipoBadge({ tipo }: TipoBadgeProps) {
    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                width: 100,
                backgroundColor: getColorForTipo(tipo),
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textAlign: 'center',
            }}
        >
            {tipo}
        </Box>
    );
}