import React, { Component } from 'react';
import Card from './components/Card'
import Loading from './components/Loading'
import './App.css';
import City from './City'
import axios from 'axios'
import moment from 'moment-timezone'
require('moment/locale/es')

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cities: [],
      errorMessage: '',
      localTimestamp: new Date().getTime(),
      lastUpdateTimestamp: new Date().getTime(),
      lastUpdateHumanized: '',
      isLoading: true,
      isFetchingForecast: false,
      isSocketOnline: false,
      isErrorVisible: false,
    }
    this.ticker = null
  }

  toCelsius(fahrenheit) {
    return parseFloat((fahrenheit - 32) / 1.8).toFixed(1)
  }

  fetchCities () {
    axios.get('http://localhost:5000/api/forecast')
    .then(response => {
      if (response.data.success) {
        // El api envió bien las ciudades.
        this.setState({
          cities: response.data.data.map(city => new City(city)),
          isErrorVisible: false,
          errorMessage: '',
          isLoading: false
        }, () => {
          this.startTicker()
        })
      } else {
        // Envió un error, reintentar.
        setTimeout(() => {
          console.log('Refetch cities')
          this.fetchCities()
        }, 1000)
      }
    })
    .catch(error => {
      // Envió un error, reintentar.
      setTimeout(() => {
        console.log('Refetch cities')
        this.fetchCities()
      }, 1000)
    })
  }

  formatCityTime (city) {
    return city.time !== '' && city.timezone !== '' 
      ? moment.tz(city.time, city.timezone).format('DD-MM-YYYY hh:mm:ss A')
      : ''
  }

  showError () {

  }

  startSocket () {
    // Si en 3 segundos no ha iniciado el socket, reintentar.
    if (!this.state.isSocketOnline)
      setTimeout(() => {
        this.startSocket()
      }, 3000)

    try {
      const socket = new WebSocket(process.env.REACT_APP_SOCKET_URL)
      socket.addEventListener('open', (e) => {
        this.setState({
          isSocketOnline: true
        })
        console.log('opened socket')
      })
      socket.addEventListener('message', e => {
        const payload = JSON.parse(e.data)
        console.log('Recibido', payload)
        // Si es un objeto valido, rehidratar ciudades.
        if (payload.success) {
          // forecast valido, actualizar ciudades.
          this.setState({
            cities: payload.data.cities,
            lastUpdateTimestamp: new Date().getTime(),
            isFetchingForecast: false,
            isErrorVisible: false,
            errorMessage: '',
            lastUpdateHumanized: this.getHumanizedDiff(new Date().getTime(), this.state.localTimestamp)
          })
        } else {
          console.log('Error en socket: ', payload.data.error)

          // Mostrar error en barra superior
          this.setState({
            isErrorVisible: true,
            errorMessage: payload.data.error
          })

          // Pedir forecast al socket (si no hay otro fetch en progreso).
          if (!this.state.isFetchingForecast)
            this.setState({
              isFetchingForecast: true
            }, () => {
              socket.send('request-forecast')
            })        
        }
      })
    }
    catch (e) {
      // Reintentar conexion en un segundo.
      setTimeout(() => {
        console.log('Reconectar socket')
        this.startSocket()
      }, 1000)
    }
  }

  startTicker () {
    if (this.ticker) clearInterval(this.ticker)

    this.ticker = setInterval(() => {
      this.tick()
    }, 1000)  
  }

  tick () {
    // Solo actualizar ciudades si existen.
    let updatedCities = this.state.cities
    if (this.state.cities.length > 0)
    updatedCities = this.state.cities.map(city => {
      return {
        time: moment(city.time).add(1, 'seconds'),
        ...city
      } 
    })

    const now = moment(this.state.localTimestamp).add(1, 'seconds')

    this.setState({
      localTimestamp: now,
      lastUpdateHumanized: this.getHumanizedDiff(now, this.state.lastUpdateTimestamp),
      cities: updatedCities
    })
  }

  getHumanizedDiff (from, to) {
    return moment.duration(moment(from).diff(moment(to))).humanize()
  }

  componentWillMount () {
    // Cargar ciudades.
    this.fetchCities()

    // Iniciar socket.
    this.startSocket()

    // Iniciar ticker.
    this.startTicker()
    
  }

  render() {
    return (
      <div className="app">
        {this.state.isLoading && <Loading/>}
        {!this.state.isLoading && (
          <div className="dashboard">
            <div className="top-bar">
              <div className="top-bar-local">
                {moment(this.state.localTimestamp).format('DD-MM-YYYY hh:mm:ss A')}
                {this.state.localTimestamp !== this.state.lastUpdateTimestamp && 
                  ' | Actualizado hace ' + this.state.lastUpdateHumanized}
              </div>
              {this.state.isErrorVisible && (
                <div className="top-bar-error">
                  {this.state.errorMessage}
                </div>
              )}
            </div>

            {this.state.cities.length > 0 && (
              <div className="cities-grid">
                {this.state.cities.map(city => {
                  return (
                    <Card 
                      key={city.id}
                      name={city.name}
                      temperature={city.temperature === '' ? '-' : this.toCelsius(city.temperature) + ' ºC'}
                      isLoading={city.isLoading}
                      dateTime={city.time === '' ? '-' : this.formatCityTime(city.time)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default App;

