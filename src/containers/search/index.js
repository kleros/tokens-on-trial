import React, { Component } from 'react'
import Downshift from 'downshift'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import * as tokensActions from '../../actions/tokens'

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
    fetchTokens: PropTypes.func.isRequired,
    envObjects: PropTypes.shape({
      FILE_BASE_URL: PropTypes.string.isRequired
    }).isRequired
  }

  itemClicked = selection => {
    const { history } = this.props
    history.push(`/token/${selection.tokenID}`)
  }

  itemCompute = item => (item ? item.value : '')

  render() {
    const { tokens, envObjects } = this.props
    const FILE_BASE_URL = envObjects ? envObjects.FILE_BASE_URL : null
    const tokenData = tokens.items
    const tokenSubmissions = Object.keys(tokenData).map(tokenID => {
      const {
        name,
        ticker,
        address,
        symbolMultihash,
        clientStatus,
        inAppealPeriod
      } = tokenData[tokenID]
      return {
        value: name || '',
        searchVal: name ? name.toLowerCase() : '',
        tokenID,
        name,
        ticker,
        address,
        symbolMultihash,
        clientStatus,
        inAppealPeriod
      }
    })

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
              <input
                {...getInputProps()}
                className="SearchBar-input"
                placeholder="Search tokens.."
              />
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
                            FILE_BASE_URL={FILE_BASE_URL}
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
      tokens: state.tokens.data,
      envObjects: state.envObjects.data
    }),
    {
      fetchTokens: tokensActions.fetchTokens
    }
  )(SearchBar)
)
