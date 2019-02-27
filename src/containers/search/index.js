import React, { PureComponent } from 'react'
import Downshift from 'downshift'
import { withRouter } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import { arbitrableTokenList, web3 } from '../../bootstrap/dapp-api'

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
    arbitrableTokenList.events.TokenSubmitted({ fromBlock: 0 }, (err, data) => {
      if (err) {
        console.error('Error fetching token submission: ', err)
        return
      }
      const { returnValues } = data
      const { tokenSubmissions } = this.state
      const { _name, _ticker, _symbolMultihash, _address } = returnValues
      if (!_name) return

      const tokenID = web3.utils.soliditySha3(
        _name || '',
        _ticker,
        _address,
        _symbolMultihash
      )

      tokenSubmissions.push({
        value: _name || '',
        searchVal: _name ? _name.toLowerCase() : '',
        tokenID,
        name: _name,
        ticker: _ticker,
        address: _address,
        imgSrc: _symbolMultihash
      })
    })
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
              {isOpen && inputValue.length > 0 && (
                <ul {...getMenuProps()} className="SearchBar-results">
                  {isOpen
                    ? tokenSubmissions
                        .filter(
                          item =>
                            inputValue.length > 0 &&
                            (item.name
                              .toLowerCase()
                              .includes(inputValue.toLowerCase()) ||
                              item.ticker
                                .toLowerCase()
                                .includes(inputValue.toLowerCase()))
                        )
                        .map((item, index) => (
                          <Item
                            item={item}
                            {...getItemProps({
                              key: index,
                              index,
                              item
                            })}
                          />
                        ))
                    : null}
                </ul>
              )}
            </div>
          )}
        </Downshift>
      </div>
    )
  }
}

export default withRouter(SearchBar)
