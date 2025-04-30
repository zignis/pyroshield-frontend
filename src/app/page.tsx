'use client';

import styles from './page.module.css';
import React from 'react';
import Device from '@/app/device';
import Divider from '@/app/divider';
import Stat from '@/app/stat';
import { Cache, StreamItem } from '../../types';
import {
    pushMessage,
    setCache,
    setDeviceConnected,
    setSelectedDevice,
    useAppDispatch,
    useAppSelector,
} from '@/app/store';
import {
    consumedMemoryPercentage,
    getChargePercentage,
    rssiToPercentage,
    selectAverage,
} from '@/app/utils';
import dynamic from 'next/dynamic';
import { CHART_SAMPLE_SIZE, CO2_THRESHOLD } from '../../constants';
import { CO2Chart, TemperatureChart } from '@/app/chart';
import clsx from 'clsx';

const GeoLocation = dynamic(() => import('@/app/geo'), {
    ssr: false,
});

const Map = dynamic(() => import('@/app/map'), {
    ssr: false,
});

const DeviceList = (): React.ReactElement => {
    const dispatch = useAppDispatch();
    const cache = useAppSelector((state) => state.cache);
    const devices = React.useMemo(() => Object.keys(cache), [cache]);
    const selected = useAppSelector((state) => state.selectedDevice);

    React.useEffect(() => {
        if (!selected && Object.keys(devices).length === 1) {
            dispatch(setSelectedDevice(devices[0]));
        }
    }, [devices, dispatch, selected]);

    return (
        <ul className={styles.deviceList}>
            {devices.map((deviceId) => (
                <Device
                    key={deviceId}
                    deviceId={deviceId}
                    selected={selected === deviceId}
                    onClick={() =>
                        dispatch(
                            setSelectedDevice(
                                selected === deviceId ? null : deviceId
                            )
                        )
                    }
                />
            ))}
        </ul>
    );
};

const DeviceStats = (): React.ReactElement | null => {
    const data = useAppSelector(
        (state) => state.cache[`${state.selectedDevice}`]
    );
    const avgBatteryVoltage = useAppSelector((state) =>
        selectAverage(state, {
            valueSelector: (message) => message.power?.battery?.voltage || 0,
        })
    );
    const avgChargerVoltage = useAppSelector((state) =>
        selectAverage(state, {
            valueSelector: (message) => message.power?.charger?.voltage || 0,
        })
    );

    if (!data?.latest) {
        return null;
    }

    return (
        <div className={styles.statContainer}>
            {/* Environment */}
            <div>
                <Stat
                    heading={'CO2'}
                    style={{
                        color:
                            data.latest.co2_ppm >= CO2_THRESHOLD
                                ? '#ee0000'
                                : 'inherit',
                    }}
                >
                    {data.latest.co2_ppm.toLocaleString()} <span>PPM</span>
                </Stat>
                <Stat heading={'Pressure'}>
                    {data.latest.pressure.toLocaleString()} <span>hPa</span>
                </Stat>

                <Stat heading={'Humidity'}>
                    {data.latest.dht22.humidity}
                    <span>%</span>
                </Stat>
            </div>
            <div>
                <Stat heading={'Indoor temp.'}>
                    {data.latest.bmp280.temp} <span>°C</span>
                </Stat>
                <Stat heading={'Outdoor temp.'}>
                    {data.latest.dht22.temp} <span>°C</span>
                </Stat>
            </div>
            {/* GPS */}
            <span data-spacer={''}>
                GPS
                <span />
            </span>
            <div>
                <Stat heading={'Satellites'}>{data.latest.gps.satellites}</Stat>
                <Stat heading={'Altitude'}>
                    {(
                        data.latest.gps.altitude || data.latest.bmp280.altitude
                    ).toLocaleString()}{' '}
                    <span>mtr</span>
                </Stat>
            </div>
            <div>
                <Stat heading={'Latitude'}>{data.latest.gps.lat}</Stat>
                <Stat heading={'Longitude'}>{data.latest.gps.lng}</Stat>
            </div>
            {/* Power */}
            <span data-spacer={''}>
                Power
                <span />
            </span>
            <div>
                <Stat heading={'Battery temp.'}>
                    {data.latest.power.battery.temp} <span>°C</span>
                </Stat>
                <Stat heading={'Battery voltage'}>
                    {avgBatteryVoltage}
                    <span>v</span>{' '}
                    <span>
                        (
                        {getChargePercentage(
                            Number.parseFloat(avgBatteryVoltage || '0') || 0
                        )}
                        %)
                    </span>
                </Stat>
                <Stat heading={'Charger voltage'}>
                    {avgChargerVoltage}
                    <span>v</span>
                </Stat>
            </div>
            {/* System */}
            <span data-spacer={''}>
                System
                <span />
            </span>
            <div>
                <Stat heading={'RSSI'}>
                    {data.latest.rssi} <span>dBm</span>{' '}
                    <span>({rssiToPercentage(data.latest.rssi)}%)</span>
                </Stat>
                <Stat heading={'SNR'}>
                    {data.latest.snr} <span>dB</span>
                </Stat>
            </div>
            <div>
                <Stat heading={'Memory consumed'}>
                    {data.latest.sys.mem_usage.toLocaleString()}{' '}
                    <span>bytes</span>{' '}
                    <span>
                        ({consumedMemoryPercentage(data.latest.sys.mem_usage)}%)
                    </span>
                </Stat>
            </div>
        </div>
    );
};

const Charts = (): React.ReactElement | null => {
    const data = useAppSelector(
        (state) => state.cache[`${state.selectedDevice}`]
    );

    if (!data) {
        return null;
    }

    const messages = data.messages.slice(-CHART_SAMPLE_SIZE);

    return (
        <React.Fragment>
            <CO2Chart messages={messages} />
            <TemperatureChart messages={messages} />
        </React.Fragment>
    );
};

const FetchData = (): null => {
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        let src: EventSource;

        const fetchInitialData = async () => {
            const res = await fetch('/api/data', { method: 'GET' });

            if (!res.ok) return;

            try {
                const data = (await res.json()) as Cache;
                dispatch(setCache(data));
            } catch (e) {
                console.error(e);
            }
        };

        const streamMessages = async () => {
            src = new EventSource('/api/stream');

            src.onmessage = (event) => {
                try {
                    const { type, body } = JSON.parse(event.data) as StreamItem;

                    if (type === 'message') {
                        dispatch(pushMessage(body));
                    } else if (type === 'device-disconnected') {
                        dispatch(
                            setDeviceConnected({
                                deviceId: body,
                                connected: false,
                            })
                        );
                    }
                } catch (err) {
                    console.error(err);
                }
            };

            src.onerror = (err) => {
                console.error(err);
                src.close();
            };
        };

        fetchInitialData().then(streamMessages).catch(console.error);

        return () => {
            src?.close?.();
        };
    }, [dispatch]);

    return null;
};

export default function Home() {
    return (
        <main className={styles.main}>
            <section className={styles.left}>
                <DeviceStats />
                <Divider layout={'horizontal'} />
                <div>
                    <h4
                        style={{
                            marginBottom: '16px',
                            marginTop: '-8px',
                            fontWeight: '600',
                        }}
                    >
                        Nearby devices
                    </h4>
                    <DeviceList />
                </div>
            </section>
            <Divider layout={'vertical'} />
            <section className={clsx(styles.right)}>
                <Map />
                <Charts />
            </section>
            <FetchData />
            <GeoLocation />
        </main>
    );
}
