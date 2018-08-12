import React, { Component } from 'react';
import './Loading.css';

class Loading extends Component {
    render () {
        return (
            <div className="loading">
                <div className="sk-folding-cube">
                    <div className="sk-cube1 sk-cube"></div>
                    <div className="sk-cube2 sk-cube"></div>
                    <div className="sk-cube4 sk-cube"></div>
                    <div className="sk-cube3 sk-cube"></div>
                </div>
            </div>
        )
    }
}

export default Loading;