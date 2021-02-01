import React, { useEffect, useState } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'
import Img from 'react-image'
import { IPFS_URL } from '../../../../bootstrap/dapp-api'
import * as tcrConstants from '../../../../constants/tcr'
import { instantiateEnvObjects } from '../../../../utils/tcr'
import EtherScanLogo from '../../../../assets/images/etherscan.png'
import './evidence-card.css'

const downloadClick = (url) => async () => {
  window.open(`${IPFS_URL}${encodeURI(url)}`)
}

const EvidenceCard = ({
  evidence: { evidence: evidenceFile, _party, icon, blockNumber, txHash },
  idKey,
  requester,
  challenger,
}) => {
  const [fetchingSubmissionDate, setFetchingSubmissionDate] = useState(true)
  const [submissionDate, setSubmissionDate] = useState(0)
  useEffect(() => {
    const fetchTimestamp = async () => {
      const { viewWeb3 } = await instantiateEnvObjects()
      const { timestamp } = await viewWeb3.eth.getBlock(blockNumber)
      setFetchingSubmissionDate(false)
      setSubmissionDate(new Date(timestamp * 1000).toUTCString().slice(5))
    }
    fetchTimestamp()
  }, [blockNumber, txHash])

  return (
    <div className="EvidenceCard" key={idKey}>
      <div className="EvidenceCard-content">
        {evidenceFile.title && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <p className="EvidenceCard-content-title">{evidenceFile.title}</p>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ alignSelf: 'flex-end' }}
            >
              <Img src={EtherScanLogo} className="EvidenceCard-content-title" />
            </a>
          </div>
        )}
        {evidenceFile.description && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p>{evidenceFile.description}</p>
            {!evidenceFile.title && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ alignSelf: 'flex-end' }}
              >
                <Img
                  src={EtherScanLogo}
                  className="EvidenceCard-content-title"
                />
              </a>
            )}
          </div>
        )}
      </div>
      <div className="EvidenceCard-footer">
        <div
          className="EvidenceCard-footer-meta"
          data-tip={
            evidenceFile.evidenceSide
              ? `Evidence ${
                  evidenceFile.evidenceSide &&
                  evidenceFile.evidenceSide === tcrConstants.SIDE.Requester
                    ? 'supporting'
                    : 'against'
                } requester`
              : ''
          }
        >
          {!evidenceFile.evidenceSide ||
          evidenceFile.evidenceSide === tcrConstants.SIDE.None ? (
            <div
              className="EvidenceCard-footer-icon"
              style={{ backgroundColor: 'grey' }}
            >
              <FontAwesomeIcon icon="comments" color="white" />
            </div>
          ) : (
            <div
              className="EvidenceCard-footer-icon"
              style={{
                backgroundColor:
                  evidenceFile.evidenceSide === tcrConstants.SIDE.Requester
                    ? '#66e800'
                    : '#f60c36',
              }}
            >
              <FontAwesomeIcon
                icon={
                  evidenceFile.evidenceSide === tcrConstants.SIDE.Requester
                    ? 'thumbs-up'
                    : 'thumbs-down'
                }
                color="white"
              />
            </div>
          )}
          <div>
            <p style={{ lineHeight: '20px' }}>
              Submitted by{' '}
              {_party === requester
                ? 'the requester'
                : _party === challenger
                ? 'the challenger'
                : 'a third party'}
            </p>
            <p style={{ lineHeight: '20px' }}>
              {!fetchingSubmissionDate ? submissionDate : ''}
            </p>
          </div>
        </div>
        {evidenceFile.fileURI && (
          <div
            style={{ cursor: 'pointer' }}
            onClick={downloadClick(evidenceFile.fileURI)}
          >
            <FontAwesomeIcon icon={icon} size="2x" />
          </div>
        )}
      </div>
    </div>
  )
}

EvidenceCard.propTypes = {
  requester: PropTypes.string.isRequired,
  challenger: PropTypes.string.isRequired,
  idKey: PropTypes.string.isRequired,
  evidence: PropTypes.shape({
    evidence: PropTypes.shape({
      fileURI: PropTypes.string,
      position: PropTypes.number,
    }).isRequired,
    _party: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
  blockNumber: PropTypes.number.isRequired,
  txHash: PropTypes.string.isRequired,
}

export default EvidenceCard
