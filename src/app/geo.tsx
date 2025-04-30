import React from 'react';
import { useGeolocated } from 'react-geolocated';
import { setReceiverLocation, useAppDispatch } from '@/app/store';

const GeoLocation = (): null => {
    const dispatch = useAppDispatch();
    const { coords } = useGeolocated({
        positionOptions: {
            enableHighAccuracy: true,
        },
        userDecisionTimeout: 5000,
        watchPosition: true,
        watchLocationPermissionChange: true,
    });

    React.useEffect(() => {
        if (coords) {
            dispatch(
                setReceiverLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                })
            );
        }
    }, [coords, dispatch]);

    return null;
};

export default GeoLocation;
