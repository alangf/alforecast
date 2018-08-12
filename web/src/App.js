import React, { Component } from 'react';
import Card from './components/Card'
import Loading from './components/Loading'
import TopBar from './components/TopBar'
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
      isConnectingToSocket: false
    }
    this.ticker = null
  }

  /**
   * La temperatura del api viene en fahrenheit.
   * @param Number fahrenheit 
   */
  toCelsius(fahrenheit) {
    return parseFloat((fahrenheit - 32) / 1.8).toFixed(1)
  }

  /**
   * Carga inicial de las ciudades.
   */
  fetchCities () {
    axios.get('/api/forecast')
    .then(response => {
      if (response.data.success) {
        // El api envió bien las ciudades.
        this.setState({
          cities: response.data.data.map(city => new City(city)),
          isErrorVisible: false,
          errorMessage: '',
          isLoading: false
        }, () => {
          console.log('Fetch inicial')
          // Iniciar socket.
          this.startSocket()

          // Iniciar ticker.
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
        this.fetchCities()
      }, 1000)
    })
  }

  /**
   * Formatea el timestamp de la ciudad.
   * @param City city 
   */
  formatCityTime (city) {
    return city.time !== '' && city.timezone !== '' 
      ? (
        <div>
          <p>moment.tz(city.time, city.timezone).format('DD-MM-YYYY')</p>
          <p>moment.tz(city.time, city.timezone).format('hh:mm:ss A')</p>
        </div>
      )
      : ''
  }

  /**
   * Incia conexion con el socket y maneja los eventos.
   */
  startSocket () {
    // Si ya esta intentando conectar, abortar.
    if (this.state.isConnectingToSocket)
      return false

    try {
      const protocol = process.env.NODE_ENV == 'development' ? 'ws://' : 'wss://'
      const socketUrl = protocol + document.location.hostname
      console.log('Abriendo socket ' + socketUrl) 
      const socket = new WebSocket(socketUrl)

      this.setState({
        isConnectingToSocket: true
      })

      socket.addEventListener('open', e => {
        this.setState({
          isSocketOnline: true,
          isConnectingToSocket: false
        })
        console.log('opened socket')

      })

      // Si se desconecta, esperar un segundo y reconectar.
      socket.addEventListener('close', e => {
        this.setState({
          isSocketOnline: false,
          isConnectingToSocket: false
        }, () => {
          setTimeout(() => {
            this.startSocket()
          }, 1000)
        })
      })

        // Esperar el forecast cada 10 segundos.
      socket.addEventListener('message', e => {
        const payload = JSON.parse(e.data)
        console.log('Recibido', payload)

        // Si es un objeto valido, actualizar ciudades.
        if (payload.success) {
          // Forecast valido, actualizar ciudades.
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

          // Esperar 1 segundo (para que el error sea visible) y pedir forecast 
          // al socket (si no hay otro fetch en progreso).
          setTimeout(() => {
            if (!this.state.isFetchingForecast)
            this.setState({
              isFetchingForecast: true
            }, () => {
              socket.send('request-forecast')
            })        
          }, 1000)
          
        }
      })
    }
    catch (e) {
      console.log('Error abriendo socket: ', e)
      // Reintentar conexion en un segundo.
      setTimeout(() => {
        this.startSocket()
      }, 1000)
    }
  }

  /**
   * Arranca intervalo para actualizar horas.
   */
  startTicker () {
    if (this.ticker) clearInterval(this.ticker)

    this.ticker = setInterval(() => {
      this.tick()
    }, 1000)  
  }

  /**
   * Suma un segundo a timestamps de hora actual, de ciudades y ultima actualizacion.
   */
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

  /**
   * Devuelve hace cuanto se actualizo en palabras.
   * @param Number from Timestamp actual
   * @param Number to Timestamp utlima actualizacion
   */
  getHumanizedDiff (from, to) {
    return moment.duration(moment(from).diff(moment(to))).humanize()
  }

  /**
   * Carga inicial de ciudades.
   */
  componentDidMount () {
    // Cargar ciudades.
    this.fetchCities()
  }

  render() {
    return (
      <div className="app">
        {this.state.isLoading && <Loading/>}
        {!this.state.isLoading && (
          <div className="dashboard">
            <TopBar
              current={moment(this.state.localTimestamp).format('DD-MM-YYYY hh:mm:ss A')}
              updated={this.state.localTimestamp !== this.state.lastUpdateTimestamp ? this.state.lastUpdateHumanized : ''}
              isErrorVisible={this.state.isErrorVisible}
              errorMessage={this.state.errorMessage} 
            />

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

