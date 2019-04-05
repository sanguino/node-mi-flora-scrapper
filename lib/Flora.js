const EventEmitter = require('events');
const debug = require('debug')('flora-scrapper');
const floraDevice = require('./FloraDevice');

class Flora extends EventEmitter {

    delay (ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    async listenDevice(macAddress) {
        const device = await floraDevice.getDevice(macAddress).catch((err) => debug('error', err));

        await this.delay(1000);

        let data = await device.readPromise(0x41).catch((err) => debug('error', err));
        const started = (new Date).getTime() - data.readUInt32LE(0)*1000;
        debug('epoch:', data.readUInt32LE(0));
        debug('started:', new Date(started));

        data = await device.readPromise(0x0038).catch((err) => debug('error', err));
        this.parseFirmwareData(data);

        await device.writePromise(0x0033, Buffer.from([0xA0, 0x1F])).catch((err) => debug('error', err));
        data = await device.readPromise(0x0035).catch((err) => debug('error', err));
        this.parseData(data);

        await device.writePromise(0x003e, Buffer.from([0xA0, 0x00, 0x00])).catch((err) => debug('error', err));
        data = await device.readPromise(0x003c).catch((err) => debug('error', err));
        let historyItems =  data.readUInt16LE(0);
        debug('historyItems:', historyItems);

        while(historyItems > 0) {
            historyItems --;
            await device.writePromise(0x003e, Buffer.from([0xA1, historyItems, 0x00])).catch((err) => debug('error', err));
            data = await device.readPromise(0x003c).catch((err) => debug('error', err));
            this.parseHistData(data, started);
        }
    }

    parseHistData(data, started) {
        debug('parseHistData:', data);
        const parsed = {
            timestamp: data.readUInt32LE(0),
            date: new Date(started + data.readUInt32LE(0)*1000),
            temperature: data.readUInt16LE(4) / 10,
            lux: data.readUInt32LE(7),
            moisture: data.readUIntLE(11, 1),
            fertility: data.readUInt16LE(12),
        };
        this.emit('history', parsed);
    }

    parseData(data) {
        debug('data:', data);
        const parsed = {
            temperature: data.readUInt16LE(0) / 10,
            lux: data.readUInt32LE(3),
            moisture: data.readUIntLE(7, 1),
            fertility: data.readUInt16LE(8),
        };

        this.emit('data', parsed);
    }

    parseFirmwareData(data) {
        debug('firmware data:', data);
        let firmware = {
            batteryLevel: parseInt(data.toString('hex', 0, 1), 16),
            firmwareVersion: data.toString('ascii', 2, data.length)
        };
        this.emit('firmware', firmware);
    }
}

module.exports = Flora;
