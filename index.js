'use strict';

require('dotenv').config()

const fs = require('fs');
const path = require('path')
const pg = require('./lib/pg.js');
const wiot = require('./lib/watson_iot.js');
const server = require('http').createServer();
const io = require('socket.io')(server);

// Save Postgres certificate to file
const cert_b64 = process.env.PG_CERT_BASE_64
const cert_buffer = new Buffer(cert_b64, 'base64');  
const cert_ascii = cert_buffer.toString('ascii');
fs.writeFileSync("./pgroot.crt", cert_ascii)

// Watson IoT device type to subscribe too
const DEVICE_TYPE = process.env.WIOT_DEVICE_TYPE

let error_handle = (err) => {
  console.log(err)
  process.exit(1)
}

let insertWrapper = (deviceType, deviceId, eventType, format, payload) => {
  pg.insertEvent(deviceType, deviceId, eventType, format, payload, io)
}

pg.setup().then(db => {
  wiot.setup().then(ducks => {
    console.log('listening for device events...')

    ducks.subscribeToDeviceEvents(DEVICE_TYPE)
    ducks.on("deviceEvent", insertWrapper);

  }, error_handle)
}, error_handle)

// Run socket.io server
let port = process.env.PORT || 3000
server.listen(port, function() {
  console.log('socket.io server listening on port: '+port)
});

module.exports = io