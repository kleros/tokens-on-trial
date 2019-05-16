import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import { IPFS_URL } from '../../../../bootstrap/dapp-api'

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
  <div
    style={{
      alignSelf:
        evidenceFile.position === 1
          ? 'flex-start'
          : evidenceFile.position === 2
          ? 'flex-start'
          : 'auto',

      width: evidenceFile.position ? '' : '75%'
    }}
    className="EvidenceCard"
    key={idKey}
  >
    <div className="EvidenceCard-content">
      {evidenceFile.title && (
        <p className="EvidenceCard-content-title">{evidenceFile.title}</p>
      )}
      {evidenceFile.description && <p>{evidenceFile.description}</p>}
    </div>
    <div className="EvidenceCard-footer">
      <div className="EvidenceCard-footer-meta">
        {evidenceFile.position && (
          <FontAwesomeIcon
            icon={evidenceFile.position === 1 ? 'thumbs-up' : 'thumbs-down'}
          />
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
