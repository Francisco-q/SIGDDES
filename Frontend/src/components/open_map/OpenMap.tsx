import 'leaflet/dist/leaflet.css';
import React from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

const MapComponent: React.FC = () => {
  const center: [number, number] = [51.505, -0.09];
  const zoom = 13;

  const AttributionControl = () => {
    const map = useMap();
    console.log('Mapa en AttributionControl:', map);
    return null;
  };

  return (
    <MapContainer style={{ height: '100vh', width: '100%', zIndex: 0 }} center={center} zoom={zoom}>
      {/* Elimina SetView temporalmente si es necesario */}
      <AttributionControl />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;