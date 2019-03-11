import React, { PureComponent } from 'react'
import Downshift from 'downshift'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import * as tokensActions from '../../actions/tokens'
import { arbitrableTokenList, web3 } from '../../bootstrap/dapp-api'

import Item from './item'

import './search-bar.css'

class SearchBar extends PureComponent {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,
    tokens: PropTypes.shape({
      blockHeight: PropTypes.number.isRequired
    }).isRequired,
    addTokens: PropTypes.func.isRequired
  }

  state = {
    tokenSubmissions: []
  }

  async componentDidMount() {
    const { tokens, addTokens } = this.props
    const events = await arbitrableTokenList.getPastEvents('TokenSubmitted', {
      fromBlock: 0
    })
    const blockHeight = events.reduce((acc, curr) => {
      const { blockNumber } = curr
      return acc
        ? blockNumber > acc.blockNumber
          ? blockNumber
          : acc.blockNumber
        : blockNumber
    })

    const receivedTokens = events.reduce(
      (acc, event) => {
        const { returnValues } = event
        const { _name, _ticker, _symbolMultihash, _address } = returnValues
        if (!_name || !_ticker) return acc

        const tokenID = web3.utils.soliditySha3(
          _name || '',
          _ticker || '',
          _address,
          _symbolMultihash
        )

        acc[tokenID] = {
          name: _name,
          ticker: _ticker,
          address: _address,
          symbolMultihash: _symbolMultihash
        }
        return acc
      },
      { ...tokens }
    )
    addTokens({ tokens: receivedTokens, blockHeight })
  }

  componentWillReceiveProps(props) {
    const { tokens } = props
    const tokenSubmissions = Object.keys(tokens)
      .filter(key => key !== 'blockHeight')
      .map(tokenID => {
        const { name, ticker, address, symbolMultihash } = tokens[tokenID]

        return {
          value: name || '',
          searchVal: name ? name.toLowerCase() : '',
          tokenID,
          name,
          ticker,
          address,
          symbolMultihash
        }
      })
    this.setState({ tokenSubmissions })
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
                                .includes(inputValue.toLowerCase()) ||
                              item.address.toLowerCase() ===
                                inputValue.toLowerCase())
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

export default withRouter(
  connect(
    state => ({
      tokens: state.tokens
    }),
    {
      addTokens: tokensActions.addTokens
    }
  )(SearchBar)
)
