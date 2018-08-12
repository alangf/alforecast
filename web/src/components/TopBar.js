import React, { Component } from 'react';
import './TopBar.css';

class TopBar extends Component {
  render () {
    return (
      <div className="top-bar">
        <div className="top-bar-local">
          {this.props.current}
          {this.props.updated !== '' && (
            <small className="top-bar-duration">
              {'Actualizado hace ' + this.props.updated}
            </small>
          )}
        </div>
        {this.props.isErrorVisible && (
          <div className="top-bar-error">
            {this.props.errorMessage}
          </div>
        )}
      </div>
    )
  }
}

export default TopBar
