import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { Circle, ImageOverlay, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import { Path, ReceptionQR, TotemQR } from '../../../types/types';
import SetView from '../MapaUtils/SetView';

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
    onCreateTotem: (lat: number, lng: number) => void;
    onCreateReception: (lat: number, lng: number) => void;
    initialPoint: TotemQR | ReceptionQR | null;
    setWarningMessage: (message: string) => void;
    setWarningModalOpen: (open: boolean) => void;
    onPathClick: (path: Path) => void;
    showPointNames: boolean;
}

const ClickpolylinesClickHandler: React.FC<{
    positions: [number, number][];
    path: Path;
    onClick: (path: Path) => void;
}> = ({ positions, path, onClick }) => {
    const map = useMap();

    useEffect(() => {
        const polyline = L.polyline(positions, { color: 'blue', weight: 5 });
        polyline.addTo(map);
        polyline.on('click', () => onClick(path));

        return () => {
            polyline.off('click');
            polyline.removeFrom(map);
        };
    }, [positions, path, onClick, map]);

    return null;
};

const createLabelIcon = (icon: L.Icon, name: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
      <div style="position: relative; text-align: center;">
        <img src="${icon.options.iconUrl}" style="width: ${(icon.options.iconSize! as [number, number])[0]}px; height: ${(icon.options.iconSize! as [number, number])[1]}px; margin-bottom: 5px;" />
        <div style="color: #000; font-size: 12px; font-weight: bold; background: rgba(197, 188, 188, 0.7); padding: 2px 5px; border-radius: 3px; width: 4vh;">
          ${name}
        </div>
      </div>
    `,
        iconSize: [(icon.options.iconSize! as [number, number])[0], (icon.options.iconSize! as [number, number])[1] + 20],
        iconAnchor: [(icon.options.iconAnchor! as [number, number])[0], (icon.options.iconAnchor! as [number, number])[1] + 10],
        shadowUrl: icon.options.shadowUrl,
        shadowSize: icon.options.shadowSize,
    });
};

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
    onCreateTotem,
    onCreateReception,
    initialPoint,
    setWarningMessage,
    setWarningModalOpen,
    onPathClick,
    showPointNames,
}) => {
    const svgBounds: [[number, number], [number, number]] = [
        [51.505, -0.09],
        [51.51, -0.1],
    ];

    const ZoomToInitialPoint: React.FC<{ initialPoint: TotemQR | ReceptionQR | null }> = ({ initialPoint }) => {
        const map = useMap();

        useEffect(() => {
            if (initialPoint) {
                const { latitude, longitude } = initialPoint;
                map.setView([latitude, longitude], 20);
            }
        }, [initialPoint, map]);

        return null;
    };

    const MapClickHandler: React.FC = () => {
        useMapEvents({
            click(e) {
                if (!['admin', 'superuser'].includes(role as string)) {
                    setWarningMessage("Solo administradores pueden interactuar con el mapa para crear puntos o caminos.");
                    setWarningModalOpen(true);
                    return;
                }

                const { lat, lng } = e.latlng;

                if (isCreatingPath) {
                    if (currentPathPoints.length === 0) {
                        const isNearTotem = totems.some(t =>
                            Math.abs(t.latitude - lat) < 0.0001 && Math.abs(t.longitude - lng) < 0.0001
                        );
                        if (!isNearTotem) {
                            setWarningMessage('El primer punto del camino debe ser un Tótem QR.');
                            setWarningModalOpen(true);
                            return;
                        }
                    }
                    setCurrentPathPoints([...currentPathPoints, [lat, lng]]);
                } else if (isCreatingTotem) {
                    onCreateTotem(lat, lng);
                } else if (isCreatingReception) {
                    onCreateReception(lat, lng);
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
            <ZoomToInitialPoint initialPoint={initialPoint} />
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
            {['admin', 'superuser'].includes(role as string) && <MapClickHandler />}
            {isCreatingPath && ['admin', 'superuser'].includes(role as string) && (
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
                            icon={showPointNames ? createLabelIcon(totemIcon, totem.name) : totemIcon}
                            eventHandlers={{ click: () => handlePointClick(totem) }}
                        />
                    ))}
                    {receptions.map(reception => (
                        <Marker
                            key={reception.id}
                            position={[reception.latitude, reception.longitude]}
                            icon={showPointNames ? createLabelIcon(receptionIcon, reception.name) : receptionIcon}
                            eventHandlers={{ click: () => handlePointClick(reception) }}
                        />
                    ))}
                </>
            )}
            {currentPathPoints.length > 0 && ['admin', 'superuser'].includes(role as string) && (
                <Polyline positions={currentPathPoints} color="red" weight={5} />
            )}
            {showPaths &&
                paths.map(path => (
                    <ClickpolylinesClickHandler
                        key={path.id}
                        positions={path.points.map((p: { latitude: any; longitude: any }) => [p.latitude, p.longitude])}
                        path={path}
                        onClick={onPathClick}
                    />
                ))}
            <ZoomControl position="topright" />
        </MapContainer>
    );
};

export default MapComponent;