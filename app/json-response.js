/**
 * Utilidad de respuesta de api.
 * @param Boolean success Si no hubo errores es true.
 * @param Any payload La respuesta de la llamada.
 */
module.exports = (success, data) => { 
    return {
        ...{ success, data }
    }
}
