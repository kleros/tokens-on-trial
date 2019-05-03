import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const CrowdfundingMsg = ({ decisiveRuling }) =>
  decisiveRuling ? (
    <div className="TokenDetailsCard-info">
      <FontAwesomeIcon
        color="#4d00b4"
        icon="exclamation-triangle"
        style={{
          width: '30px',
          height: '30px',
          margin: '15px',
          marginTop: 0
        }}
      />
      <p
        style={{
          color: '#4d00b4',
          fontSize: '14px',
          lineHeight: '16px',
          textAlign: 'center'
        }}
      >
        If the loser complete it’s appeal funding, the winner of the previous
        round should also fully fund the appeal, in order not to lose the case.
      </p>
    </div>
  ) : (
    <div className="TokenDetailsCard-info">
      <FontAwesomeIcon
        color="#4d00b4"
        icon="exclamation-triangle"
        style={{
          width: '30px',
          height: '30px',
          margin: '15px',
          marginTop: 0
        }}
      />
      <p
        style={{
          color: '#4d00b4',
          fontSize: '14px',
          lineHeight: '16px',
          textAlign: 'center'
        }}
      >
        If neither party fully funds, the request will not be executed and
        parties will be reimbursed. However, if one of the parties is fully
        funded, the other must also fully fund in order to not loose the
        dispute.
      </p>
    </div>
  )

CrowdfundingMsg.propTypes = {
  decisiveRuling: PropTypes.bool.isRequired
}

export default CrowdfundingMsg
