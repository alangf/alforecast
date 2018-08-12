require('dotenv').load();

const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors')
const Promise = require("bluebird");
const WebSocket = require('ws');
const socket = require('./app/socket')
const server = require('http').createServer(app)

app.use(cors())

// Iniciar cache
const client = Promise.promisifyAll(require('redis')).createClient(process.env.REDIS_URL)
const CacheUtil = require('./app/cache')
const cache = new CacheUtil(client) 


// Cargar ciudades antes de todo.
const connectAndLoad = function () {
    client.on('connect', function () {
        // Cargar ciudades de json.
        cache.loadCities()
    })    
}

client.on('error', error => {
    console.log('Redis connection error: ' + error)
    // Esperar y reintentar
    setTimeout(() => connectAndLoad(), process.env.REDIS_RECONNECT_TIMEOUT)
})

connectAndLoad()

require('./app/routes')(app, cache);

console.log(process.env.NODE_ENV)

// Iniciar express
server.listen(port)

// Iniciar socket
try {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', ws => {
        console.log('Nueva conexión de socket') 
        socket(ws, cache)
    });
}
catch (e) {
    console.log('Error iniciando socket: ', e)
}