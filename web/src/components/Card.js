import React, { Component } from 'react';
import './Card.css';

class Card extends Component {
  render () {
    return (
      <div className="city">
        <h1 className="city-name">{this.props.name}</h1>
        <h2 className="city-temperature">{this.props.temperature}</h2>
        <div className="city-date">{this.props.dateTime}</div>
      </div>
    )
  }
}

export default Card;

