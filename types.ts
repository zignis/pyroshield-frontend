export interface SerialResponse {
    device_id: number;
    forwarder_id: number;
    message_id: number;
    allow_forwarding: boolean;
    ttl: number;
    co2_ppm: number;
    pressure: number;
    rssi: number;
    snr: number;
    bmp280: {
        altitude: number;
        temp: number;
    };
    dht22: {
        temp: number;
        humidity: number;
    };
    gps: {
        altitude: number;
        lat: string;
        lng: string;
        satellites: number;
    };
    battery: {
        temp: number;
        voltage: number;
    };
    charger: {
        voltage: number;
    };
    sys: {
        mem_usage: number;
    };
}

export interface Message {
    header: {
        id: number;
        device_id: number;
        forwarder_id: number | null;
        allow_forwarding: boolean;
        ttl: number;
        rssi: number;
        snr: number;
        timestamp: number;
    };
    body: {
        co2_ppm: number;
        pressure: number;
        bmp280: {
            altitude: number;
            temp: number;
        };
        dht22: {
            temp: number;
            humidity: number;
        };
        gps: {
            altitude: number;
            lat: string;
            lng: string;
            satellites: number;
        };
    };
    power: {
        battery: {
            temp: number;
            voltage: number;
        };
        charger: {
            voltage: number;
        };
    };
    sys: {
        mem_usage: number;
    };
}

export interface LatestDeviceData {
    rssi: number;
    snr: number;
    co2_ppm: number;
    pressure: number;
    bmp280: {
        altitude: number;
        temp: number;
    };
    dht22: {
        temp: number;
        humidity: number;
    };
    gps: {
        altitude: number;
        lat: string;
        lng: string;
        satellites: number;
    };
    power: {
        battery: {
            temp: number;
            voltage: number;
        };
        charger: {
            voltage: number;
        };
    };
    sys: {
        mem_usage: number;
    };
}

export interface DeviceData {
    connected: boolean;
    messages: Array<Message>;
    latest: LatestDeviceData | null;
    last_message: number | null;
}

export type Cache = { [key: string]: DeviceData };

export type StreamItem =
    | { type: 'message'; body: Message }
    | { type: 'device-disconnected'; body: string };
