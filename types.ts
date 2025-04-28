export interface SerialResponse {
    device_id: number;
    forwarder_id: number;
    message_id: number;
    allow_forwarding: boolean;
    ttl: number;
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
        allow_forwarding: boolean;
        forwarder_id: number | null;
        ttl: number;
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

export interface DeviceData {
    connected: boolean;
    messages: Array<Message>;
    last_message: number | null;
}

export type Cache = { [key: string]: DeviceData };
