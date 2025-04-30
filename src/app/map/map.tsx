'use client';

import React from 'react';
import {
    Circle,
    LayerGroup,
    MapContainer,
    Marker,
    TileLayer,
    Tooltip,
} from 'react-leaflet';
import { useAppSelector } from '@/app/store';
import { Icon, LatLngExpression } from 'leaflet';
import styles from './map.module.css';
import { CO2_THRESHOLD } from '../../../constants';

const Markers = (): React.ReactElement => {
    const cache = useAppSelector((state) => state.cache);
    return (
        <React.Fragment>
            {Object.entries(cache).map(([deviceId, data]) =>
                parseInt(data.latest?.gps.lat || '0') &&
                parseInt(data.latest?.gps.lng || '0') ? (
                    <LayerGroup key={`${deviceId}:${data.messages.length}`}>
                        <Circle
                            center={[
                                parseFloat(data.latest!.gps.lat),
                                parseFloat(data.latest!.gps.lng),
                            ]}
                            pathOptions={{
                                color:
                                    (data.latest?.co2_ppm || 0) >= CO2_THRESHOLD
                                        ? '#ee0000'
                                        : '#1dda60',
                            }}
                            radius={1}
                            fillOpacity={1}
                            className={styles.fade}
                        />
                        <Circle
                            center={[
                                parseFloat(data.latest!.gps.lat),
                                parseFloat(data.latest!.gps.lng),
                            ]}
                            pathOptions={{
                                color:
                                    (data.latest?.co2_ppm || 0) >= CO2_THRESHOLD
                                        ? '#ee0000'
                                        : data.connected
                                          ? '#129a43'
                                          : '#7c7c7c',
                            }}
                            stroke
                            fillOpacity={0.7}
                            radius={15}
                        >
                            <Tooltip>
                                Device: <b>{deviceId}</b>
                            </Tooltip>
                        </Circle>
                    </LayerGroup>
                ) : null
            )}
        </React.Fragment>
    );
};

const Map = (): React.ReactElement | null => {
    const clientCoords = useAppSelector((state) => state.receiverLocation);
    const coords = [
        clientCoords?.latitude,
        clientCoords?.longitude,
    ] as LatLngExpression;

    const markerIcon = new Icon({
        iconUrl: '/home.png',
        iconSize: [26, 26],
    });

    return (
        <div className={styles.mapContainer}>
            {clientCoords ? (
                <MapContainer
                    className={styles.map}
                    center={coords}
                    zoom={16}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker icon={markerIcon} position={coords}>
                        <Tooltip>
                            <b>Home</b> (receiver)
                        </Tooltip>
                    </Marker>
                    <Markers />
                </MapContainer>
            ) : (
                <span data-error={''}>Location unavailable</span>
            )}
        </div>
    );
};

export default Map;
