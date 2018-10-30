import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'

import Button from '../button'
import * as modalConstants from '../../constants/modal'
import * as modalActions from '../../actions/modal'

import './title-bar.css'

class TitleBar extends PureComponent {
  static propTypes = {
    // Action Dispatchers
    openTokenModal: PropTypes.func.isRequired
  }

  handleSubmitClick = () => {
    const { openTokenModal } = this.props
    openTokenModal(modalConstants.TOKEN_MODAL_ENUM.Submit)
  }

  render() {
    return (
      <div className="TitleBar">
        <h3 className="TitleBar-title">Token² Curated Registry</h3>
        <Button
          type="primary"
          size="normal"
          className="TitleBar-submitToken"
          onClick={this.handleSubmitClick}
        >
          <FontAwesomeIcon icon="plus" className="TitleBar-submitToken-icon" />
          Submit a Token
        </Button>
      </div>
    )
  }
}

export default connect(
  null,
  {
    openTokenModal: modalActions.openTokenModal
  }
)(TitleBar)
