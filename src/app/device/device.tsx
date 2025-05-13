import React from 'react';
import styles from './device.module.css';
import clsx from 'clsx';
import { getDistance } from 'geolib';
import { useAppSelector } from '@/app/store';
import { isThresholdExceeded } from '@/app/utils';

export interface DeviceProps extends React.ComponentPropsWithoutRef<'li'> {
    deviceId: string;
    selected?: boolean;
}

const Device = ({
    className,
    deviceId,
    selected,
    ...rest
}: DeviceProps): React.ReactElement => {
    const device = useAppSelector((state) => state.cache[deviceId]);
    const receiverCoords = useAppSelector((state) => state.receiverLocation);
    const distance = React.useMemo(() => {
        if (device?.latest && receiverCoords) {
            const deviceCoords = {
                latitude: Number.parseFloat(device.latest.gps.lat),
                longitude: Number.parseFloat(device.latest.gps.lng),
            };

            if (!deviceCoords.latitude || !deviceCoords.longitude) {
                return null;
            }

            return getDistance(deviceCoords, receiverCoords);
        }

        return null;
    }, [device, receiverCoords]);
    const active = !!device?.connected;

    return (
        <li
            {...rest}
            role={'button'}
            className={clsx(
                styles.device,
                active && styles.active,
                selected && styles.selected,
                className
            )}
        >
            <span className={styles.deviceName}>
                {deviceId}{' '}
                <span>
                    ({device.messages.length.toLocaleString()} memory /{' '}
                    {(
                        device.messages[device.messages.length - 1]?.header
                            ?.id || 0
                    ).toLocaleString()}{' '}
                    transmitted)
                </span>
            </span>
            {distance && (
                <span className={styles.distance}>
                    <span>{distance.toLocaleString()}</span> meters away
                </span>
            )}
            <span
                data-active={String(active)}
                data-alert={String(
                    isThresholdExceeded(
                        device.latest?.co2_ppm || 0,
                        device.latest?.dht22?.temp || 0
                    )
                )}
                key={device.messages.length}
                className={styles.indicator}
            />
        </li>
    );
};

export default Device;
