import React, { Component } from 'react'
import Downshift from 'downshift'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import * as tokensActions from '../../actions/tokens'
import { arbitrableTokenList, web3 } from '../../bootstrap/dapp-api'

import Item from './item'

import './search-bar.css'

class SearchBar extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,
    tokens: PropTypes.shape({
      blockNumber: PropTypes.number.isRequired
    }).isRequired,
    cacheTokens: PropTypes.func.isRequired
  }

  state = {
    tokenSubmissions: []
  }

  async componentDidMount() {
    const { tokens, cacheTokens } = this.props
    const submissionEvents = await arbitrableTokenList.getPastEvents(
      'TokenSubmitted',
      { fromBlock: tokens.blockNumber }
    )

    const blockNumber = submissionEvents.reduce((acc, event) => {
      const { blockNumber } = event
      return blockNumber > acc ? blockNumber : acc
    }, 0)

    const missingTokens = []
    const receivedTokens = submissionEvents.reduce(
      (acc, event) => {
        const { returnValues } = event
        const { _name, _ticker, _symbolMultihash, _address } = returnValues

        // Web3js does not handle the string "0x" well and returns null. This
        // is a problem for the case of the ZRX token (previously, 0x), where a
        // party may submit it as either the name or the ticker.
        // The result is that we cannot properly calculate the tokenID with
        // web3.utils.soliditySha3.
        //
        // We handle these cases manually by merging results from TokenSubmission
        // and TokenStatusChange events.
        if (!_name || !_ticker) {
          missingTokens.push({
            name: _name,
            ticker: _ticker,
            address: _address,
            symbolMultihash: _symbolMultihash,
            blockNumber: event.blockNumber
          })
          return acc
        }

        const tokenID = web3.utils.soliditySha3(
          _name,
          _ticker,
          _address,
          _symbolMultihash
        )

        acc[tokenID] = {
          name: _name,
          ticker: _ticker,
          address: _address,
          symbolMultihash: _symbolMultihash,
          blockNumber: event.blockNumber,
          status: { blockNumber: 0 }
        }
        return acc
      },
      { ...tokens }
    )

    // Get the lastest status change for every token.
    let statusBlockNumber = 0
    const latestStatusChanges = {}
    const statusChanges = await arbitrableTokenList.getPastEvents(
      'TokenStatusChange',
      {
        fromBlock: tokens.statusBlockNumber
      }
    )
    statusChanges.forEach(event => {
      const { returnValues } = event
      const { _tokenID } = returnValues
      if (event.blockNumber > statusBlockNumber)
        statusBlockNumber = event.blockNumber

      if (!latestStatusChanges[_tokenID]) {
        latestStatusChanges[_tokenID] = event
        return
      }
      if (event.blockNumber > latestStatusChanges[_tokenID].blockNumber)
        latestStatusChanges[_tokenID] = event
    })

    const cachedTokens = {
      ...tokens,
      ...receivedTokens,
      blockNumber,
      statusBlockNumber
    }

    const statusEvents = Object.keys(latestStatusChanges).map(
      tokenID => latestStatusChanges[tokenID]
    )

    for (const event of statusEvents) {
      const { returnValues, blockNumber } = event
      const { _tokenID, _status, _disputed } = returnValues

      if (!cachedTokens[_tokenID])
        // This is a missing token due to the web3js bug described above.
        for (const missingToken of missingTokens) {
          const tokenInfo = await arbitrableTokenList.methods
            .getTokenInfo(_tokenID)
            .call()
          if (
            tokenInfo.name === missingToken.name &&
            tokenInfo.ticker === missingToken.ticker &&
            tokenInfo.address === missingToken.addr &&
            tokenInfo.symbolMultihash === missingToken.symbolMultihash
          ) {
            missingToken.name = missingToken.name || '0x'
            missingToken.ticker = missingToken.ticker || '0x'
            cachedTokens[_tokenID] = {
              ...missingToken,
              status: {
                blockNumber,
                status: Number(_status),
                disputed: Boolean(Number(_disputed))
              }
            }
          }
        }

      if (blockNumber > cachedTokens[_tokenID].status.blockNumber)
        cachedTokens[_tokenID].status = {
          blockNumber,
          status: Number(_status),
          disputed: Boolean(Number(_disputed))
        }
    }

    cacheTokens({ tokens: cachedTokens })
  }

  componentWillReceiveProps(props) {
    const { tokens } = props
    const tokenSubmissions = Object.keys(tokens)
      .filter(key => key !== 'blockNumber' && key !== 'statusBlockNumber')
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
              {isOpen && tokenSubmissions.length > 0 && inputValue.length > 0 && (
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
      cacheTokens: tokensActions.cacheTokens
    }
  )(SearchBar)
)
