'use client';

import React from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cache, Message } from '../../types';
import { MAX_DEVICE_MESSAGES } from '../../constants';

export interface AppState {
    cache: Cache;
    selectedDevice: string | null;
    receiverLocation?: { latitude: number; longitude: number }; // Location of this device.
}

const appSlice = createSlice({
    name: 'app',
    initialState: {
        cache: {},
        selectedDevice: null,
    } as AppState,
    reducers: {
        setSelectedDevice(state, { payload }: PayloadAction<string | null>) {
            state.selectedDevice = payload;
        },
        setCache(state, { payload }: PayloadAction<Cache>) {
            state.cache = payload;
        },
        setDeviceConnected(
            state,
            {
                payload: { deviceId, connected },
            }: PayloadAction<{ deviceId: string; connected: boolean }>
        ) {
            if (state.cache[deviceId]) {
                state.cache[deviceId].connected = connected;
            }
        },
        setReceiverLocation(
            state,
            { payload }: PayloadAction<AppState['receiverLocation']>
        ) {
            state.receiverLocation = payload;
        },
        pushMessage(state, { payload: message }: PayloadAction<Message>) {
            const device_id = `0x${message.header.device_id}`;
            const previous = state.cache[device_id]?.latest;
            const {
                header: { rssi, snr },
                body: { co2_ppm, dht22, bmp280, pressure, gps },
                power,
                sys,
            } = message;
            const latest = {
                rssi,
                snr,
                co2_ppm,
                dht22,
                bmp280,
                pressure,
                gps: {
                    altitude: gps.altitude || previous?.gps?.altitude || 0,
                    lat: Number.parseFloat(gps.lat)
                        ? gps.lat
                        : previous?.gps?.lat || '0.0',
                    lng: Number.parseFloat(gps.lng)
                        ? gps.lng
                        : previous?.gps?.lng || '0.0',
                    satellites:
                        gps.satellites || previous?.gps?.satellites || 0,
                },
                power,
                sys,
            };

            if (!state.cache[device_id]) {
                state.cache[device_id] = {
                    connected: true,
                    messages: [message],
                    latest,
                    last_message: Date.now(),
                };
            } else {
                const messageList = [
                    ...state.cache[device_id].messages,
                    message,
                ];

                state.cache[device_id].connected = true;
                state.cache[device_id].latest = latest;
                state.cache[device_id].last_message = Date.now();

                // Limit messages array size
                while (messageList.length >= MAX_DEVICE_MESSAGES) {
                    messageList.unshift();
                }

                state.cache[device_id].messages = messageList;
            }
        },
    },
});

const {
    pushMessage,
    setCache,
    setDeviceConnected,
    setSelectedDevice,
    setReceiverLocation,
} = appSlice.actions;

const makeStore = () =>
    configureStore({
        reducer: appSlice.reducer,
    });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export {
    pushMessage,
    setCache,
    setDeviceConnected,
    setSelectedDevice,
    setReceiverLocation,
};

export const StoreProvider = ({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement => {
    const storeRef = React.useRef<AppStore | null>(null);

    if (!storeRef.current) {
        storeRef.current = makeStore();
    }

    return <Provider store={storeRef.current}>{children}</Provider>;
};
