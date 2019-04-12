import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'
import { BeatLoader } from 'react-spinners'

import { onlyInfura } from '../../bootstrap/dapp-api'
import { itemShape } from '../../reducers/generic-shapes'
import Button from '../button'

import './evidence.css'

const EvidenceSection = ({
  item: {
    latestRequest: { resolved, disputed },
    clientStatus
  },
  evidences,
  handleOpenEvidenceModal,
  handleViewEvidenceClick
}) =>
  !resolved || (resolved && clientStatus === 0) ? (
    <div className="Evidence">
      <hr className="Evidence-separator" />
      <div className="Evidence-header">
        <h3>Evidence</h3>
        <Button
          tooltip={onlyInfura ? 'Please install MetaMask.' : null}
          disabled={onlyInfura}
          onClick={handleOpenEvidenceModal}
          type="secondary"
        >
          Submit Evidence
        </Button>
      </div>
      <div className="Evidence-evidence">
        <div className="Evidence-evidence--list">
          {evidences ? (
            <>
              {Object.keys(evidences)
                .sort(
                  (a, b) => evidences[a].blockNumber - evidences[b].blockNumber
                )
                .map(key => (
                  <div
                    className="Evidence-evidence--item"
                    key={key}
                    onClick={handleViewEvidenceClick(evidences[key])}
                  >
                    <FontAwesomeIcon icon={evidences[key].icon} size="2x" />
                  </div>
                ))}
            </>
          ) : (
            <>
              {disputed && (
                <div>
                  <BeatLoader color="#3d464d" />
                  <small>
                    <i>
                      Evidence can take some time to load. Thanks for the
                      patience
                    </i>
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  ) : null

EvidenceSection.propTypes = {
  item: itemShape,
  evidences: PropTypes.objectOf(
    PropTypes.shape({
      icon: PropTypes.string.isRequired
    }).isRequired
  ),
  handleOpenEvidenceModal: PropTypes.func.isRequired,
  handleViewEvidenceClick: PropTypes.func.isRequired
}

EvidenceSection.defaultProps = {
  evidences: null,
  item: null
}

export default EvidenceSection
