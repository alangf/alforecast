const axios = require('axios')
const BASE_URL = process.env.API_URL + process.env.API_KEY + '/'

module.exports = {
    /**
     * Carga el forecast para una ciudad.
     * @param String lat 
     * @param String lng 
     */
    getForecast (city) {
        // DEBUG: bloquear request.
        if (process.env.BLOCK_API === true) {
            console.log('bloqueando')
            return new Promise((resolve, reject) => {
                return reject('Blocked')
            })
        }

        return new Promise((resolve, reject) => {
            axios.get(BASE_URL + city.lat + ',' + city.lng)
            .then(response => {
                resolve({
                    city,
                    forecast: response.data
                })
            })
            .catch(error => {
                reject(error)
            })
        })
    },

    /**
     * Recibe un array de ciudades, consulta al api por cada una y devuelve 
     * una promesa que se resuelve si todas las peticiones salieron bien.
     * @param Array coords 
     */
    getForecasts (cities) {
        return Promise.all(cities.map(city => this.getForecast(city)))
    }
}