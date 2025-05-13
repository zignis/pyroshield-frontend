import { AppState } from '@/app/store';
import { Message } from '../../types';
import { createSelector } from 'reselect';
import { CO2_THRESHOLD, TEMP_THRESHOLD } from '../../constants';

const BATTERY_VOLTAGE_CONVERSION_TABLE = [
    3.2, 3.25, 3.3, 3.35, 3.4, 3.45, 3.5, 3.55, 3.6, 3.65, 3.7, 3.703, 3.706,
    3.71, 3.713, 3.716, 3.719, 3.723, 3.726, 3.729, 3.732, 3.735, 3.739, 3.742,
    3.745, 3.748, 3.752, 3.755, 3.758, 3.761, 3.765, 3.768, 3.771, 3.774, 3.777,
    3.781, 3.784, 3.787, 3.79, 3.794, 3.797, 3.8, 3.805, 3.811, 3.816, 3.821,
    3.826, 3.832, 3.837, 3.842, 3.847, 3.853, 3.858, 3.863, 3.868, 3.874, 3.879,
    3.884, 3.889, 3.895, 3.9, 3.906, 3.911, 3.917, 3.922, 3.928, 3.933, 3.939,
    3.944, 3.95, 3.956, 3.961, 3.967, 3.972, 3.978, 3.983, 3.989, 3.994, 4.0,
    4.008, 4.015, 4.023, 4.031, 4.038, 4.046, 4.054, 4.062, 4.069, 4.077, 4.085,
    4.092, 4.1, 4.111, 4.122, 4.133, 4.144, 4.156, 4.167, 4.178, 4.189, 4.2,
];

/**
 * Selects average of a field for a device.
 */
export const selectAverage = createSelector(
    [
        (state: AppState) => state.cache,
        (state: AppState) => state.selectedDevice,
        (
            _state: AppState,
            payload: {
                deviceId?: string;
                valueSelector: (message: Message) => number;
                sampleSize?: number;
                precision?: number;
            }
        ) => payload,
    ],
    (
        cache,
        selectedDevice,
        { deviceId, valueSelector, sampleSize = 10, precision = 2 }
    ) => {
        const data = cache[deviceId || selectedDevice || ''];

        if (!data) {
            return null;
        }

        const sample = data.messages.slice(-sampleSize).map(valueSelector);
        const sum = sample.reduce((prev, curr) => prev + curr, 0);

        return (sum / sample.length).toFixed(precision);
    }
);

/**
 * Returns the approx. charge percentage of an 18650 battery based on its voltage.
 * @param voltage The current battery voltage.
 */
export const getChargePercentage = (voltage: number): number => {
    let index = 50;
    let previousIndex = 0;

    // Binary search
    while (previousIndex !== index) {
        const half = Math.abs(index - previousIndex) >> 1;
        previousIndex = index;

        const currentValue = BATTERY_VOLTAGE_CONVERSION_TABLE[index];
        if (currentValue === voltage) return index;

        index = voltage >= currentValue ? index + half : index - half;
    }

    return index;
};

/**
 * Maps RSSI value to strength percentage.
 * @param rssi The RSSI value.
 */
export const rssiToPercentage = (rssi: number): number => {
    const MIN_RSSI = -127;
    const MAX_RSSI = -40;

    const clampedRSSI = Math.max(MIN_RSSI, Math.min(MAX_RSSI, rssi));
    const percentage = ((clampedRSSI - MIN_RSSI) / (MAX_RSSI - MIN_RSSI)) * 100;

    return Math.round(percentage);
};

/**
 * Returns the percentage of the STM32 memory consumed at the transmitter.
 * @param consumed The number of bytes consumed at the transmitter.
 */
export const consumedMemoryPercentage = (consumed: number): number => {
    const SRAM = 20 * 1024; // 20kb for STM32
    return Math.round((consumed / SRAM) * 100);
};

/**
 * Returns a boolean value indicating whether the emergency threshold has been exceeded.
 * @param co2_ppm The CO2 PPM value.
 * @param outside_temp The outside temperature reading.
 */
export const isThresholdExceeded = (
    co2_ppm: number,
    outside_temp: number
): boolean => {
    return co2_ppm >= CO2_THRESHOLD || outside_temp >= TEMP_THRESHOLD;
};
