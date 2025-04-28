import express from 'express';
import { parse } from 'url';
import next from 'next';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import EventEmitter from 'node:events';
import { SerialResponse, Cache, Message } from './types';

const APP_CACHE: Cache = {};
const MAX_DEVICE_MESSAGES = 500;

const serialPort = new SerialPort({
    path: '/dev/cu.usbserial-130', // Receiver path
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
                last_message: null,
            };
        }

        const message: Message = {
            header: {
                id: message_id,
                forwarder_id: forwarder_id === device_id ? null : forwarder_id,
                allow_forwarding,
                ttl,
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
                res.write(`data: ${JSON.stringify(message)}\n\n`);
            };

            eventEmitter.on('message', messageHandler);

            req.on('close', () => {
                eventEmitter.off('message', messageHandler);
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
        }
    });
}, 30 * 1000);
