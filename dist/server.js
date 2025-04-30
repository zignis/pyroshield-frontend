"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const node_events_1 = __importDefault(require("node:events"));
const constants_1 = require("./constants");
const APP_CACHE = {};
const serialPort = new serialport_1.SerialPort({
    path: '/dev/cu.usbserial-130', // Receiver path
    baudRate: 9600,
});
const parser = serialPort.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\r\n' }));
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const eventEmitter = new node_events_1.default();
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
    var _a, _b, _c, _d;
    if (!line) {
        return;
    }
    try {
        const { device_id, message_id, forwarder_id, allow_forwarding, ttl, rssi, snr, co2_ppm, pressure, bmp280, dht22, gps, battery, charger, sys, } = JSON.parse(line);
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
        const message = {
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
                altitude: gps.altitude || ((_a = latest === null || latest === void 0 ? void 0 : latest.gps) === null || _a === void 0 ? void 0 : _a.altitude) || 0,
                lat: Number.parseFloat(gps.lat)
                    ? gps.lat
                    : ((_b = latest === null || latest === void 0 ? void 0 : latest.gps) === null || _b === void 0 ? void 0 : _b.lat) || '0.0',
                lng: Number.parseFloat(gps.lng)
                    ? gps.lng
                    : ((_c = latest === null || latest === void 0 ? void 0 : latest.gps) === null || _c === void 0 ? void 0 : _c.lng) || '0.0',
                satellites: gps.satellites || ((_d = latest === null || latest === void 0 ? void 0 : latest.gps) === null || _d === void 0 ? void 0 : _d.satellites) || 0,
            },
            power: {
                battery,
                charger,
            },
            sys,
        };
        // Limit messages array size
        while (APP_CACHE[key].messages.length >= constants_1.MAX_DEVICE_MESSAGES) {
            APP_CACHE[key].messages.unshift();
        }
        eventEmitter.emit('message', message);
    }
    catch (err) {
        console.error('failed to parse incoming data:', err);
    }
});
app.prepare()
    .then(() => {
    const server = (0, express_1.default)();
    server.get('/api/data', (_req, res) => {
        res.json(APP_CACHE);
    });
    server.get('/api/stream', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        const messageHandler = (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message', body: message })}\n\n`);
        };
        const disconnectHandler = (device_id) => {
            res.write(`data: ${JSON.stringify({
                type: 'device-disconnected',
                body: device_id,
            })}\n\n`);
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
        const parsedUrl = (0, url_1.parse)(req.url, true);
        return handle(req, res, parsedUrl);
    });
    server.listen(port, (err) => {
        if (err)
            throw err;
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
        if (data.connected &&
            data.last_message &&
            Date.now() - data.last_message >= 120 * 1000 // No messages received for more than  2 minutes.
        ) {
            APP_CACHE[key].connected = false;
            eventEmitter.emit('device-disconnected', key);
        }
    });
}, 30 * 1000);
