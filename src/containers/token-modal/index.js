import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import browserImageCompression from 'browser-image-compression'

import { IMAGES_BASE_URL } from '../../bootstrap/dapp-api'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as tokenSelectors from '../../reducers/token'
import * as tokenActions from '../../actions/token'
import * as modalSelectors from '../../reducers/modal'
import * as modalActions from '../../actions/modal'
import Modal from '../../components/modal'
import Button from '../../components/button'
import * as modalConstants from '../../constants/modal'
import * as errorConstants from '../../constants/error'

import Submit from './components/submit'
import Details from './components/details'

import './token-modal.css'

class TokenModal extends PureComponent {
  static propTypes = {
    // Redux State
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
    token: tokenSelectors.tokenShape.isRequired,
    openTokenModal: modalSelectors.openTokenModalShape,

    // Action Dispatchers
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired,
    executeTokenRequest: PropTypes.func.isRequired,
    submitTokenChallenge: PropTypes.func.isRequired,
    appealTokenRuling: PropTypes.func.isRequired,
    executeTokenRuling: PropTypes.func.isRequired,
    closeTokenModal: PropTypes.func.isRequired
  }

  static defaultProps = {
    // Redux State
    openTokenModal: null
  }

  state = { imageFileDataURL: null, imageFileInfoMessage: null }

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
  }

  componentDidUpdate(prevProps) {
    const { token: prevToken } = prevProps
    const { token } = this.props
    if (prevToken.creating && !token.creating)
      this.setState({
        imageFileDataURL: null,
        imageFileInfoMessage: token.failedCreating ? (
          token.error.message === errorConstants.TOKEN_ALREADY_SUBMITTED ? (
            token.error.message
          ) : (
            'Failed to submit Token.'
          )
        ) : (
          <span>
            Token submitted successfully.{' '}
            <Button
              to={`https://twitter.com/intent/tweet?text=I%20just%20submitted%20this%20token%20to%20Kleros%27%20Tokens%20on%20Trial%20curated%20list%20experiment.%20Try%20it%20out%20at%20https%3A%2F%2Ftokensontrial.dog&url=${encodeURIComponent(
                IMAGES_BASE_URL + token.data.ID
              )}&hashtags=TokensOnTrial,Kleros,Ethereum,Blockchain`}
              type="ternary"
              size="small"
            >
              Share on Twitter
            </Button>
          </span>
        )
      })
  }

  handleOnFileDropAccepted = async ([file]) => {
    // It's not an image
    if (file.type.slice(0, 5) !== 'image')
      return this.setState({
        imageFileDataURL: null,
        imageFileInfoMessage: 'File is not an image.'
      })

    // It's an image, try to compress it
    let compressedFile =
      file.type.slice(6, 9) === 'gif'
        ? file
        : await browserImageCompression(file, 0.3)
    // Sometimes compression can increase its size
    compressedFile = file.size < compressedFile.size ? file : compressedFile

    // It's still too big
    if (compressedFile.size > 3e6)
      return this.setState({
        imageFileDataURL: null,
        imageFileInfoMessage:
          'Image is too big and cannot be resized. It must be less than 100KB.'
      })

    // It's small enough now, check dimensions
    const imageFileDataURL = await browserImageCompression.getDataUrlFromFile(
      compressedFile
    )
    const img = await browserImageCompression.loadImage(imageFileDataURL)
    if (img.width < 250 || img.height < 250)
      return this.setState({
        imageFileDataURL: null,
        imageFileInfoMessage:
          'Image is too small. It must be more than 250px wide and 250px tall.'
      })

    // All good
    this.setState({
      imageFileDataURL,
      imageFileInfoMessage: null
    })
  }

  handleSubmitTokenClick = () => {
    const { createToken } = this.props
    const { imageFileDataURL } = this.state
    createToken(imageFileDataURL)
  }

  handleExecuteRequestClick = ({ currentTarget: { id } }) => {
    const { executeTokenRequest } = this.props
    executeTokenRequest(id)
  }

  handleSubmitChallengeClick = ({ currentTarget: { id } }) => {
    const { submitTokenChallenge } = this.props
    submitTokenChallenge(id)
  }

  handleAppealClick = ({ currentTarget: { id } }) => {
    const { appealTokenRuling } = this.props
    appealTokenRuling(id)
  }

  handleExecuteRulingClick = ({ currentTarget: { id } }) => {
    const { executeTokenRuling } = this.props
    executeTokenRuling(id)
  }

  render() {
    const {
      arbitrableTokenListData,
      token,
      openTokenModal,
      closeTokenModal
    } = this.props
    const { imageFileDataURL, imageFileInfoMessage } = this.state
    return (
      <Modal
        isOpen={openTokenModal !== null}
        onRequestClose={
          token.creating || token.updating ? null : closeTokenModal
        }
        className="TokenModal"
      >
        {openTokenModal === modalConstants.TOKEN_MODAL_ENUM.Submit ? (
          <Submit
            arbitrableTokenListData={arbitrableTokenListData}
            token={token}
            imageFileDataURL={imageFileDataURL}
            imageFileInfoMessage={imageFileInfoMessage}
            handleOnFileDropAccepted={this.handleOnFileDropAccepted}
            handleSubmitTokenClick={this.handleSubmitTokenClick}
          />
        ) : openTokenModal === modalConstants.TOKEN_MODAL_ENUM.Details ? (
          <Details
            arbitrableTokenListData={arbitrableTokenListData}
            token={token}
            onExecuteRequestClick={this.handleExecuteRequestClick}
            onSubmitChallengeClick={this.handleSubmitChallengeClick}
            onAppealClick={this.handleAppealClick}
            onExecuteRulingClick={this.handleExecuteRulingClick}
          />
        ) : null}
      </Modal>
    )
  }
}

export default connect(
  state => ({
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    token: state.token.token,
    openTokenModal: state.modal.openTokenModal
  }),
  {
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    createToken: tokenActions.createToken,
    executeTokenRequest: tokenActions.executeTokenRequest,
    submitTokenChallenge: tokenActions.submitTokenChallenge,
    appealTokenRuling: tokenActions.appealTokenRuling,
    executeTokenRuling: tokenActions.executeTokenRuling,
    closeTokenModal: modalActions.closeTokenModal
  }
)(TokenModal)
