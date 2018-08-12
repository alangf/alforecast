const api = require('./api')

class CacheUtil {
    constructor (client) {
        this.client = client
    }

    /**
     * Cargar ciudades a redis.
     */
    loadCities () {
        const dataCities = require('./data/cities.json')
        dataCities.forEach((item, key) => {
            item.id = key
            item.temperature = ""
            item.time = ""
            item.timezone = ""
            item.icon = ""
            this.client.hmset('city:' + key, item)
        })
    }

    /**
     * Cargar ciudades de redis.
     */
    getCities (key) {
        // Keys de los hashes.
        return new Promise((resolve, reject) => {
            this.getCityKeys()
            .then(keys => {
                try {
                    // Pedir todos los hashes.
                    const multi = this.client.multi()
                    keys.sort().forEach(key => {
                        multi.hgetall(key)
                    })
                    multi.exec((error, result) => {
                        if (error) {
                            reject('Error leyendo los hashes: ' + error)
                        }
                        
                        // Devolver los hashes de la ciudades.
                        resolve(result)
                    })
                }
                catch (e) {
                    console.log('Error leyendo los hashes: ' + e)
                    reject(e)
                }
            })
            .catch(error => {
                reject('error getCityKeys', error)
            })
        })
    }

    /**
     * Devuelve los keys de todas las ciudades
     */
    getCityKeys () {
        return this.client.keysAsync('city:*')
    }

    /**
     * Actualiza la fecha y clima de cada ciudad.
     */
    updateForecasts (forecasts) {        
        return new Promise ((resolve, reject) => {
            try {
                forecasts.forEach(forecast => {
                    forecast.city.temperature = forecast.forecast.currently.temperature
                    forecast.city.time = forecast.forecast.currently.time
                    forecast.city.timezone = forecast.forecast.timezone
                    forecast.city.icon = forecast.forecast.currently.icon
                    this.client.hmset('city:' + forecast.city.id, forecast.city)
                })      
                resolve(forecasts.map(forecast => forecast.city))  
            }
            catch (e) {
                reject(e)
            }
        })
    }

    logError (error) {
        this.client.hmset('api.errors', {
            [new Date().getTime()]: error
        })
    }

    /**
     * Cargar ciudades con forecast al dia.
     */
    getUpdatedCities () {
        return new Promise((resolve, reject) => {
            // Cargar ciudades del cache.
            return this.getCities()
            .then(cities => {
                // Pedir forecast de todas las ciudades.
                return api.getForecasts(cities)
            })
            .then(forecasts => {
                // Llegaron todos, actualizar cache.
                return this.updateForecasts(forecasts)
            })
            // Finalmente devolver ciudades con forecast.
            .then(cities => {
                resolve(cities)
            })
            // Error en uno de los pasos.
            .catch(error => {
                reject(error)
            })
        })
    }
}

module.exports = CacheUtil
