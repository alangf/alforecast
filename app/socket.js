const api = require('./api')
const jsonResponse = require('./json-response')

const send = (ws, success, data) => {
    // Si esta cerrado, terminar y matar intervalo.
    if (ws.readyState !== 1) {
        ws.terminate()
        clearInterval(interval)
    } else
        ws.send(JSON.stringify(jsonResponse(success, data)))
}

/**
 * Obtiene ciudades con forecast al dia y las envia al socket.
 * @param Object cities 
 */
const emitForecast = (ws, cache) => {
    return new Promise((resolve, reject) => {
        try {
            // 10% de errores
            if (Math.random(0, 1) < 0.1) {
                throw new Error('How unfortunate! The API Request Failed')
            }

            cache.getUpdatedCities()
            .then(cities => {
                // Enviar ciudades actualizadas al app.
                console.log('Emitiendo forecast')
                send(ws, true, {cities})
                resolve(cities)
            })
            .catch(error => {
                send(ws, false, { error: error })
                reject(error)
            })
        }
        catch (error) {
            cache.logError('Error consultando la API.')
            send(ws, false, { error: error.message })
        }
    })
}

let interval

module.exports = (ws, cache) => {
    // Emitir primer forecast.
    emitForecast(ws, cache)
    .catch(error => {
        console.error('Error emitiendo primer forecast: ' + error)
    }) 

    // Y re-emitir cada 10 segundos.
    interval = setInterval(() => {
        // Solo emitir si sigue conectado.
        if (ws.readyState === 1)
            emitForecast(ws, cache)
            .catch(error => {
                console.error('Error emitiendo interval de forecast: ' + error)
            }) 
        else {
            clearInterval(interval)
            ws.terminate()
        }
    }, 10000)

    ws.on('message', message => {
        // Esperar peticiones de forecast.
        if (message == 'request-forecast') {
            console.log('Recibida peticion de forecast')
            emitForecast(ws, cache)
            .catch(error => {
                console.error('Error reintentando emitir forecast: ' + error)
            }) 
        }
    })
    
}
