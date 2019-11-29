import React, { Component } from 'react'
import Downshift from 'downshift'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

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
                        .sort((a, b) => {
                          // Status of both items are within the same category
                          // (not pending, pending, challenged), don't sort.
                          if (
                            (a.clientStatus === 0 && b.clientStatus === 1) ||
                            (a.clientStatus === 2 && b.clientStatus === 3) ||
                            (a.clientStatus === 4 && b.clientStatus === 5) ||
                            (a.clientStatus === 1 && b.clientStatus === 0) ||
                            (a.clientStatus === 3 && b.clientStatus === 2) ||
                            (a.clientStatus === 5 && b.clientStatus === 4)
                          )
                            return 0
                          if (a.clientStatus > b.clientStatus) return -1
                          if (b.clientStatus > a.clientStatus) return 1
                          return 0
                        })
                        .sort((a, b) => {
                          // Display registered tokens before rejected ones.
                          if (
                            (a.clientStatus === 0 && b.clientStatus === 1) ||
                            (a.clientStatus === 1 && a.clientStatus === 1)
                          )
                            return b.clientStatus - a.clientStatus
                          else return 0
                        })
                        .sort((a, b) => {
                          // Show items crowdfunding state first.
                          if (a.inAppealPeriod && !b.inAppealPeriod) return -1
                          else if (!a.inAppealPeriod && b.inAppealPeriod)
                            return 1
                          else return 0
                        })
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
  connect(state => ({
    tokens: state.tokens.data,
    envObjects: state.envObjects.data
  }))(SearchBar)
)
