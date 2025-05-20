import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { Circle, ImageOverlay, MapContainer, Marker, Polyline, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
// Update the import path if your types are located elsewhere, for example:
import { Path, ReceptionQR, TotemQR } from '../../../../types/types';
// Or, if the file does not exist, create 'src/types/types.ts' and export the types there.
import SetView from '../../SetView';

const totemIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
});

const receptionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
});

interface MapComponentProps {
    campus: string;
    totems: TotemQR[];
    receptions: ReceptionQR[];
    paths: Path[];
    showPaths: boolean;
    isCreatingPath: boolean;
    isCreatingTotem: boolean;
    isCreatingReception: boolean;
    currentPathPoints: [number, number][];
    setCurrentPathPoints: (points: [number, number][]) => void;
    setSelectedPoint: (point: TotemQR | ReceptionQR | null) => void;
    setIsModalOpen: (open: boolean) => void;
    role: string | null;
    mapaSrc: string;
    setWarningMessage: (message: string) => void;
    setWarningModalOpen: (open: boolean) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
    campus,
    totems,
    receptions,
    paths,
    showPaths,
    isCreatingPath,
    isCreatingTotem,
    isCreatingReception,
    currentPathPoints,
    setCurrentPathPoints,
    setSelectedPoint,
    setIsModalOpen,
    role,
    mapaSrc,
    setWarningMessage,
    setWarningModalOpen,
}) => {
    const svgBounds: [[number, number], [number, number]] = [
        [51.505, -0.09],
        [51.51, -0.1],
    ];

    const MapClickHandler: React.FC = () => {
        useMapEvents({
            click(e) {
                if (!['admin', 'superuser'].includes(role as string)) return;
                if (isCreatingPath) {
                    const { lat, lng } = e.latlng;
                    if (currentPathPoints.length === 0) {
                        const totem = totems.find(t =>
                            Math.abs(t.latitude - lat) < 0.0001 && Math.abs(t.longitude - lng) < 0.0001
                        );
                        if (!totem) {
                            setWarningMessage('El camino debe comenzar desde un Tótem QR.');
                            setWarningModalOpen(true);
                            return;
                        }
                    }
                    setCurrentPathPoints([...currentPathPoints, [lat, lng]]);
                } else if (isCreatingTotem) {
                    const { lat, lng } = e.latlng;
                    const newTotem: Omit<TotemQR, 'id'> = {
                        latitude: lat,
                        longitude: lng,
                        name: 'Nuevo Totem QR',
                        description: '',
                        imageUrls: [],
                        campus: campus || '',
                        status: 'Operativo',
                    };
                    setSelectedPoint({ ...newTotem, id: Date.now() } as TotemQR);
                    setIsModalOpen(true);
                } else if (isCreatingReception) {
                    const { lat, lng } = e.latlng;
                    const newReception: Omit<ReceptionQR, 'id'> = {
                        latitude: lat,
                        longitude: lng,
                        name: 'Nuevo Espacio Seguro',
                        description: '',
                        imageUrls: [],
                        campus: campus || '',
                        schedule: '',
                        status: 'Operativo',
                    };
                    setSelectedPoint({ ...newReception, id: Date.now() } as ReceptionQR);
                    setIsModalOpen(true);
                }
            },
        });
        return null;
    };

    const handlePointClick = (point: TotemQR | ReceptionQR) => {
        setSelectedPoint(point);
        setIsModalOpen(true);
    };

    return (
        <MapContainer
            className="openmap-map"
            zoom={18}
            maxZoom={22}
            minZoom={10}
            zoomControl={false}
        >
            {!isCreatingPath && <SetView bounds={svgBounds} zoom={18} />}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                opacity={0}
                maxZoom={19}
                minZoom={10}
            />
            {campus && (
                <ImageOverlay
                    url={mapaSrc}
                    bounds={svgBounds}
                    opacity={1}
                />
            )}
            <MapClickHandler />
            {isCreatingPath && (
                <>
                    {totems.map(totem => (
                        <Circle
                            key={`totem-circle-${totem.id}`}
                            center={[totem.latitude, totem.longitude]}
                            radius={10}
                            color="red"
                            fillColor="red"
                            fillOpacity={0.2}
                        />
                    ))}
                    {receptions.map(reception => (
                        <Circle
                            key={`reception-circle-${reception.id}`}
                            center={[reception.latitude, reception.longitude]}
                            radius={10}
                            color="blue"
                            fillColor="blue"
                            fillOpacity={0.2}
                        />
                    ))}
                </>
            )}
            {!isCreatingPath && (
                <>
                    {totems.map(totem => (
                        <Marker
                            key={totem.id}
                            position={[totem.latitude, totem.longitude]}
                            icon={totemIcon}
                            eventHandlers={{ click: () => handlePointClick(totem) }}
                        />
                    ))}
                    {receptions.map(reception => (
                        <Marker
                            key={reception.id}
                            position={[reception.latitude, reception.longitude]}
                            icon={receptionIcon}
                            eventHandlers={{ click: () => handlePointClick(reception) }}
                        />
                    ))}
                </>
            )}
            {currentPathPoints.length > 1 && <Polyline positions={currentPathPoints} color="red" weight={5} />}
            {showPaths &&
                paths.map(path => (
                    <Polyline key={path.id} positions={path.points.map((p: { latitude: any; longitude: any; }) => [p.latitude, p.longitude])} color="blue" weight={5} />
                ))}
            <ZoomControl position="topright" />
        </MapContainer>
    );
};

export default MapComponent;