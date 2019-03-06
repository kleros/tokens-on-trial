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
        <div class="TelegramButton">
          <button
            onClick={this.onCloseButtonClick}
            class="TelegramButton-closeButton"
          >
            x
          </button>
          <a
            href="https://t.me/kleros"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="TelegramButton-image"
              src={telegramButton}
              alt="Telegram Button"
            />
          </a>
          <div class="TelegramButton-help">Help</div>
        </div>
      )
    )
  }
}
