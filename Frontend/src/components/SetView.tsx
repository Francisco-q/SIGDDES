import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface SetViewProps {
  center: [number, number];
  zoom: number;
}

const SetView: React.FC<SetViewProps> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

export default SetView;