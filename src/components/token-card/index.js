import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Img from 'react-image'
import { DotLoader } from 'react-spinners'

import * as tokenConstants from '../../constants/token'

import './token-card.css'

class TokenCardImageLoader extends PureComponent {
  static propTypes = {
    // State
    failed: PropTypes.bool,

    // Callbacks
    debouncedUpdatePacking: PropTypes.func
  }

  static defaultProps = {
    // State
    failed: false,

    // Callbacks
    debouncedUpdatePacking: null
  }

  componentWillUnmount() {
    const { debouncedUpdatePacking } = this.props
    if (debouncedUpdatePacking) {
      debouncedUpdatePacking()
      console.info('debouncedUpdatePacking called.')
    }
  }

  render() {
    const { failed } = this.props
    return (
      <div className="TokenCard-image-loader">
        {failed ? (
          'There was an error fetching the image or it has not been uploaded properly. Try submitting it again.'
        ) : (
          <DotLoader color="#3d464d" />
        )}
      </div>
    )
  }
}
const TokenCard = ({
  id,
  status,
  imageSrc,
  onClick,
  debouncedUpdatePacking
}) => (
  <div
    id={id}
    onClick={onClick}
    className={`TokenCard TokenCard--${status.toLowerCase()}`}
  >
    <Img
      src={imageSrc}
      alt={`Token List Submission`}
      loader={
        <TokenCardImageLoader debouncedUpdatePacking={debouncedUpdatePacking} />
      }
      unloader={<TokenCardImageLoader failed />}
      className="TokenCard-image"
    />
    <div
      className="TokenCard-tag"
      data-tip={
        {
          Pending:
            "This image can still be challenged. If you think it's not a token, challenge it!",
          Challenged:
            'This image is currently being challenged. Stay tuned for the ruling!',
          Accepted:
            'This image has been accepted into the list and can no longer be challenged.',
          Rejected: 'This image has been rejected from the list.'
        }[status]
      }
    >
      ?
    </div>
    <div className="TokenCard-label">{status.toUpperCase()}</div>
  </div>
)

TokenCard.propTypes = {
  // State
  id: PropTypes.string.isRequired,
  status: PropTypes.oneOf(tokenConstants.STATUS_ENUM.values).isRequired,
  imageSrc: PropTypes.string.isRequired,

  // Handlers
  onClick: PropTypes.func.isRequired,

  // Callbacks
  debouncedUpdatePacking: PropTypes.func
}

TokenCard.defaultProps = {
  // Callbacks
  debouncedUpdatePacking: null
}

export default TokenCard
