import React from 'react';

import { LineChart, LineChartSlotProps } from '@mui/x-charts';
import styles from './chart.module.css';
import { Message } from '../../../types';

export interface ChartProps {
    messages: Message[];
}

const slotProps: LineChartSlotProps = {
    legend: {
        sx: {
            fontFamily: 'var(--font-geist-sans)',
            marginLeft: 'auto',
        },
    },
    axisTickLabel: {
        style: { fontFamily: 'var(--font-geist-mono)' },
    },
    axisTick: {
        style: { opacity: 0.3 },
    },
    axisLine: {
        style: { opacity: 0.3 },
    },
    mark: {
        style: {
            // @ts-expect-error prop exists
            r: 3.5,
            fill: 'var(--elevation-sm)',
        },
    },
};

export const CO2Chart = ({ messages }: ChartProps): React.ReactElement => {
    return (
        <div className={styles.chartContainer}>
            <h2>
                CO2 <span />
            </h2>
            <div className={styles.chartWrapper}>
                <LineChart
                    axisHighlight={{
                        x: 'line',
                        y: 'line',
                    }}
                    yAxis={[
                        {
                            valueFormatter: (value) =>
                                value >= 1000
                                    ? `${(value / 1000).toFixed(1)}k`
                                    : `${value}`,
                            offset: 15,
                            domainLimit: (min, max) => ({
                                min: min - 50,
                                max: max + 50,
                            }),
                            colorMap: {
                                type: 'continuous',
                                min: 400,
                                max: 5000,
                                color: ['rgba(29,218,96)', 'rgba(238,0,0)'],
                            },
                        },
                    ]}
                    xAxis={[
                        {
                            offset: 15,
                            scaleType: 'point',
                            tickLabelMinGap: 20,
                            data: messages.map((msg) =>
                                new Date(
                                    msg.header.timestamp
                                ).toLocaleTimeString()
                            ),
                        },
                    ]}
                    theme={'light'}
                    slotProps={{ ...slotProps, area: { fillOpacity: 0.2 } }}
                    series={[
                        {
                            curve: 'catmullRom',
                            area: true,
                            baseline: 'min',
                            data: messages.map((msg) => msg.body.co2_ppm),
                            valueFormatter: (value) =>
                                value == null
                                    ? '--'
                                    : `${value.toString()} PPM`,
                        },
                    ]}
                    height={200}
                />
            </div>
        </div>
    );
};

export const TemperatureChart = ({
    messages,
}: ChartProps): React.ReactElement => {
    return (
        <div className={styles.chartContainer}>
            <h2>
                Temperature <span />
            </h2>
            <div className={styles.chartWrapper}>
                <LineChart
                    axisHighlight={{
                        x: 'line',
                        y: 'line',
                    }}
                    yAxis={[
                        {
                            offset: 15,
                            domainLimit: (min, max) => ({
                                min: min - 1,
                                max: max + 1,
                            }),
                        },
                    ]}
                    xAxis={[
                        {
                            offset: 15,
                            scaleType: 'point',
                            tickLabelMinGap: 20,
                            data: messages.map((msg) =>
                                new Date(
                                    msg.header.timestamp
                                ).toLocaleTimeString()
                            ),
                        },
                    ]}
                    theme={'light'}
                    slotProps={slotProps}
                    series={[
                        {
                            label: 'Indoor temp.',
                            curve: 'catmullRom',
                            labelMarkType: 'square',
                            data: messages.map((msg) => msg.body.bmp280.temp),
                            valueFormatter: (value) =>
                                value == null ? '--' : `${value.toString()} °C`,
                        },
                        {
                            label: 'Outdoor temp.',
                            curve: 'catmullRom',
                            labelMarkType: 'square',
                            data: messages.map((msg) => msg.body.dht22.temp),
                            valueFormatter: (value) =>
                                value == null ? '--' : `${value.toString()} °C`,
                        },
                    ]}
                    height={200}
                />
            </div>
        </div>
    );
};
