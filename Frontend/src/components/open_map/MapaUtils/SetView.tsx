import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface SetViewProps {
  bounds: [[number, number], [number, number]];
  zoom?: number;
}

const SetView: React.FC<SetViewProps> = ({ bounds, zoom = 18 }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
      zoom
    );
    map.setMaxBounds(bounds);
  }, [map, bounds, zoom]);

  return null;
};

export default SetView;