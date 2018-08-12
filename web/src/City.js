class City {
    constructor (options) {
        this.id = options.id || ''
        this.name = options.name || ''
        this.lat = options.lat || ''
        this.lng = options.lng || ''
        this.temperature = options.temperature || ''
        this.time = options.time || ''
        this.isLoading = options.isLoading || false
        this.timezone = options.timezone || ''
        this.icon = options.icon || ''
    }
}

export default City