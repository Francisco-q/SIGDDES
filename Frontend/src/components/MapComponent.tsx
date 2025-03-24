import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import SetView from './SetView';

const MapComponent: React.FC = () => {
  const center: [number, number] = [51.505, -0.09];
  const zoom = 13;

  const AttributionControl = () => {
    const map = useMap();

    useEffect(() => {
      L.control.attribution({
        prefix: false,
        position: 'bottomright'
      }).addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors').addTo(map);
    }, [map]);

    return null;
  };

  return (
    <MapContainer style={{ height: '100vh', width: '100%' }}>
      <SetView center={center} zoom={zoom} />
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