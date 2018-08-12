const express = require('express')
const path = require('path')
const jsonResponse = require('./json-response')
const api = require('./api')

module.exports = (app, cache) => {

    /**
     * Devuelve la lista de ciudades.
     */
    app.get('/api/cities', (req, res) => {
        return cache.getCities()
        .then(cities => {
            res.send(jsonResponse(true, cities))
        })
        .catch(error => {
            res.send(jsonResponse(false, error))
        })
    })


    /**
     * Carga el forecast de todas las ciudades y devuelve toda la info.
     */
    app.get('/api/forecast', (req, res) => {
        // Devolver ciudades con forecast.
        cache.getUpdatedCities()
        .then(cities => {
            res.send(jsonResponse(true, cities))
        })
        .catch(error => {
            // Devolver solo ciudades.
            cache.getCities()
            .then(cities => {
                res.send(jsonResponse(true, cities))
            })
        })
    })


    // Enviar cualquier otra cosa a react.
    app.use(express.static(path.join(__dirname, '../web/build')));
    
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, '../web/build', 'index.html'));
    });

}