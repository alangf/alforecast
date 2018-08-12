const api = require('./api')
const jsonResponse = require('./json-response')


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
                ws.send(JSON.stringify(jsonResponse(true, {cities})))
                resolve(cities)
            })
            .catch(error => {
                ws.send(JSON.stringify(jsonResponse(false, { error: error })))
                reject(error)
            })
        }
        catch (error) {
            cache.logError('Error consultando la API.')
            ws.send(JSON.stringify(jsonResponse(false, { error: error.message })))
        }
    })
}

module.exports = (ws, cache) => {
    // Emitir primer forecast.
    emitForecast(ws, cache)
    .catch(error => {
        console.error('Error emitiendo primer forecast: ' + error)
    }) 

    // Y re-emitir cada 10 segundos.
    setInterval(() => {
        emitForecast(ws, cache)
        .catch(error => {
            console.error('Error emitiendo interval de forecast: ' + error)
        }) 
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
