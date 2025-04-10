// EstadoBadge.tsx

import { Box } from "@mui/material";

interface EstadoBadgeProps {
    estado: string;
}

export default function EstadoBadge({ estado }: EstadoBadgeProps) {
    let color: 'error' | 'warning' | 'success' = 'error';
    switch (estado) {
        case 'Pendiente':
            color = 'error';
            break;
        case 'En Proceso':
            color = 'warning';
            break;
        case 'Resuelto':
            color = 'success';
            break;
    }

    return (
        <Box
            sx={{
                display: 'inline-block',
                py: 0.5, // Padding vertical
                borderRadius: 1,
                width: 100,
                backgroundColor: color === 'error' ? 'red' : color === 'warning' ? 'orange' : 'green',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textAlign: 'center',
                whiteSpace: 'nowrap', // Evita que el texto se divida en varias líneas
            }}
        >
            {estado}
        </Box>
    );
}