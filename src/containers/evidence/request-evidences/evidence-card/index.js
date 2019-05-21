import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import { IPFS_URL } from '../../../../bootstrap/dapp-api'
import * as tcrConstants from '../../../../constants/tcr'

import './evidence-card.css'

const downloadClick = url => async () => {
  window.open(`${IPFS_URL}${encodeURI(url)}`)
}

const EvidenceCard = ({
  evidence: { evidence: evidenceFile, _party, icon },
  idKey,
  requester,
  challenger
}) => (
  <div className="EvidenceCard" key={idKey}>
    <div className="EvidenceCard-content">
      {evidenceFile.title && (
        <p className="EvidenceCard-content-title">{evidenceFile.title}</p>
      )}
      {evidenceFile.description && <p>{evidenceFile.description}</p>}
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
                  : '#f60c36'
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

EvidenceCard.propTypes = {
  requester: PropTypes.string.isRequired,
  challenger: PropTypes.string.isRequired,
  idKey: PropTypes.string.isRequired,
  evidence: PropTypes.shape({
    evidence: PropTypes.shape({
      fileURI: PropTypes.string,
      position: PropTypes.number
    }).isRequired,
    _party: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
  }).isRequired
}

export default EvidenceCard
