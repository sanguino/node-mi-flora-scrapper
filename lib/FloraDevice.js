const Promise = require('bluebird');
const noble = require('noble');
const debug = require('debug')('flora-scrapper');

const getDevice = (macAddress) => {
    debug('looking for:', macAddress);

    return new Promise((resolve) => {
        noble.on('discover', async peripheral => {
            if (macAddress.toLowerCase() === peripheral.address.toLowerCase()) {
                debug('trying to connect to:', macAddress);
                peripheral.connect();
                peripheral.once('connect', () => {
                    peripheral.readPromise = (handle) => {
                        return new Promise((resolve, reject) => {
                            peripheral.readHandle(handle, (error, data) => {
                                if (error) {
                                    reject(error)
                                }
                                resolve(data);
                            });
                        })
                    };
                    peripheral.writePromise = (handle, data, withoutResponse) => {
                        return new Promise((resolve, reject) => {
                            peripheral.writeHandle(handle, data, withoutResponse, error => {
                                if (error) {
                                    reject(error)
                                }
                                resolve();
                            });
                        })
                    };
                    debug('connected to ', macAddress);
                    resolve(peripheral);
                });
            }
        });

        noble.startScanning([], false);

    });
};

module.exports = {getDevice};
