import React, { PureComponent } from 'react'

import telegramButton from '../../assets/images/telegram-button.png'

import './telegram-button.css'

export default class TelegramButton extends PureComponent {
  state = { show: true }

  onCloseButtonClick = () => this.setState({ show: false })

  render() {
    const { show } = this.state
    return (
      show && (
        <div className="TelegramButton">
          <button
            onClick={this.onCloseButtonClick}
            className="TelegramButton-closeButton"
          >
            x
          </button>
          <a
            href="https://t.me/kleros"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="TelegramButton-image"
              src={telegramButton}
              alt="Telegram Button"
            />
          </a>
          <div className="TelegramButton-help">Help</div>
        </div>
      )
    )
  }
}
