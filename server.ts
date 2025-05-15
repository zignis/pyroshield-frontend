import express from 'express';
import { parse } from 'url';
import next from 'next';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import EventEmitter from 'node:events';
import { SerialResponse, Cache, Message } from './types';
import { MAX_DEVICE_MESSAGES } from './constants';

const APP_CACHE: Cache = {};

const serialPort = new SerialPort({
    path: process.env.RECEIVER_PORT as string, // Receiver path
    baudRate: 9600,
});
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const eventEmitter = new EventEmitter();

serialPort.on('open', () => {
    console.log('connected to receiver port');
});

serialPort.on('close', () => {
    console.log('receiver disconnected, trying to reconnect...');

    const timer = setInterval(() => {
        if (!serialPort.isOpen) {
            serialPort.open((err) => {
                if (!err) {
                    console.log('reconnected to serial port');
                    clearInterval(timer);
                }
            });
        }
    }, 2500);
});

parser.on('data', (line) => {
    if (!line) {
        return;
    }

    try {
        const {
            device_id,
            message_id,
            forwarder_id,
            allow_forwarding,
            ttl,
            rssi,
            snr,
            co2_ppm,
            pressure,
            bmp280,
            dht22,
            gps,
            battery,
            charger,
            sys,
        } = JSON.parse(line) as SerialResponse;
        const key = `0x${device_id}`;

        if (!APP_CACHE[key]) {
            APP_CACHE[key] = {
                connected: true,
                messages: [],
                latest: null,
                last_message: null,
            };
        }

        const latest = APP_CACHE[key].latest;
        const message: Message = {
            header: {
                id: message_id,
                device_id,
                forwarder_id: forwarder_id === device_id ? null : forwarder_id,
                allow_forwarding,
                ttl,
                rssi,
                snr,
                timestamp: Date.now(),
            },
            body: {
                co2_ppm,
                gps,
                dht22,
                bmp280,
                pressure,
            },
            power: {
                battery,
                charger,
            },
            sys,
        };

        APP_CACHE[key].connected = true;
        APP_CACHE[key].messages.push(message);
        APP_CACHE[key].last_message = Date.now();
        APP_CACHE[key].latest = {
            rssi,
            snr,
            co2_ppm,
            dht22,
            bmp280,
            pressure,
            gps: {
                altitude: gps.altitude || latest?.gps?.altitude || 0,
                lat: Number.parseFloat(gps.lat)
                    ? gps.lat
                    : latest?.gps?.lat || '0.0',
                lng: Number.parseFloat(gps.lng)
                    ? gps.lng
                    : latest?.gps?.lng || '0.0',
                satellites: gps.satellites || latest?.gps?.satellites || 0,
            },
            power: {
                battery,
                charger,
            },
            sys,
        };

        // Limit messages array size
        while (APP_CACHE[key].messages.length >= MAX_DEVICE_MESSAGES) {
            APP_CACHE[key].messages.unshift();
        }

        eventEmitter.emit('message', message);
    } catch (err) {
        console.error('failed to parse incoming data:', err);
    }
});

app.prepare()
    .then(() => {
        const server = express();

        server.get('/api/data', (_req, res) => {
            res.json(APP_CACHE);
        });

        server.get('/api/stream', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');

            const messageHandler = (message: Message) => {
                res.write(
                    `data: ${JSON.stringify({ type: 'message', body: message })}\n\n`
                );
            };

            const disconnectHandler = (device_id: string) => {
                res.write(
                    `data: ${JSON.stringify({
                        type: 'device-disconnected',
                        body: device_id,
                    })}\n\n`
                );
            };

            eventEmitter.on('message', messageHandler);
            eventEmitter.on('device-disconnected', disconnectHandler);

            req.on('close', () => {
                eventEmitter.off('message', messageHandler);
                eventEmitter.off('device-disconnected', disconnectHandler);
                res.end();
            });
        });

        server.get('/{*splat}', (req, res) => {
            const parsedUrl = parse(req.url!, true);
            return handle(req, res, parsedUrl);
        });

        server.listen(port, (err) => {
            if (err) throw err;
            console.log('> Ready on http://localhost:3000');
        });
    })
    .catch((ex) => {
        console.error(ex.stack);
        process.exit(1);
    });

// Update `connected` flag for all devices every 30 seconds.
setInterval(() => {
    Object.entries(APP_CACHE).forEach(([key, data]) => {
        if (
            data.connected &&
            data.last_message &&
            Date.now() - data.last_message >= 120 * 1000 // No messages received for more than  2 minutes.
        ) {
            APP_CACHE[key].connected = false;
            eventEmitter.emit('device-disconnected', key);
        }
    });
}, 30 * 1000);
