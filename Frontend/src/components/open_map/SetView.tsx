import { useMap } from 'react-leaflet';

interface SetViewProps {
  bounds: [[number, number], [number, number]];
  zoom?: number; // Zoom opcional
}

const SetView: React.FC<SetViewProps> = ({ bounds, zoom = 18 }) => {
  const map = useMap();
  map.setView(
    [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2], // Centro de los bounds
    zoom // Zoom explícito
  );
  map.setMaxBounds(bounds); // Restringe el desplazamiento a los límites del SVG
  return null;
};

export default SetView;