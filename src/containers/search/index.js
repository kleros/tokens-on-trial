import React, { PureComponent } from 'react'
import Downshift from 'downshift'
import { withRouter } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import { arbitrableTokenList } from '../../bootstrap/dapp-api'

import Item from './item'

import './search-bar.css'

class SearchBar extends PureComponent {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired
  }

  state = {
    tokenSubmissions: []
  }

  componentDidMount() {
    arbitrableTokenList.events.TokenSubmitted(
      { fromBlock: 0 },
      (err, { returnValues }) => {
        if (err) {
          console.error('Error fetching token submission: ', err)
          return
        }
        const { tokenSubmissions } = this.state
        tokenSubmissions.push({
          value: returnValues._name,
          searchVal: returnValues._name.toLowerCase(),
          tokenID: returnValues._tokenID
        })
        tokenSubmissions.push({
          value: returnValues._ticker,
          searchVal: returnValues._ticker.toLowerCase(),
          tokenID: returnValues._tokenID
        })
      }
    )
  }

  itemClicked = selection => {
    const { history } = this.props
    history.push(`/token/${selection.tokenID}`)
  }

  itemCompute = item => (item ? item.value : '')

  render() {
    const { tokenSubmissions } = this.state

    return (
      <div className="SearchBar">
        <FontAwesomeIcon icon="search" />
        <Downshift onChange={this.itemClicked} itemToString={this.itemCompute}>
          {({
            getInputProps,
            getItemProps,
            getMenuProps,
            isOpen,
            inputValue
          }) => (
            <div className="SearchBar-box">
              <input {...getInputProps()} className="SearchBar-input" />
              <ul {...getMenuProps()} className="SearchBar-results">
                {isOpen
                  ? tokenSubmissions
                      .filter(
                        item =>
                          inputValue &&
                          inputValue.length > 0 &&
                          item.searchVal.includes(inputValue.toLowerCase())
                      )
                      .map((item, index) => (
                        <Item
                          {...getItemProps({
                            key: index,
                            index,
                            item
                          })}
                        >
                          {item.value}
                        </Item>
                      ))
                  : null}
              </ul>
            </div>
          )}
        </Downshift>
      </div>
    )
  }
}

export default withRouter(SearchBar)
