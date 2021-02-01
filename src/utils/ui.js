import RegisteredBadge from '../assets/images/badges/badge-registered.svg'
import ChallengedBadge from '../assets/images/badges/badge-challenged.svg'
import WaitingBadge from '../assets/images/badges/badge-waiting.svg'
import * as tcrConstants from '../constants/tcr'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

export const getUserSide = (item, userAccount) => {
  const { latestRequest } = item
  const { parties } = latestRequest
  return userAccount === parties[tcrConstants.SIDE.Requester]
    ? tcrConstants.SIDE.Requester
    : userAccount === parties[tcrConstants.SIDE.Challenger]
    ? tcrConstants.SIDE.Challenger
    : tcrConstants.SIDE.None
}

export const isDecisiveRuling = (item) => {
  const { latestRequest } = item
  const { dispute, disputed, resolved } = latestRequest
  if (!disputed || (disputed && resolved)) return false

  const { ruling } = dispute
  return ruling !== tcrConstants.RULING_OPTIONS.None
}

export const isUserLoser = (item, userAccount) => {
  const { latestRequest } = item
  const { dispute, latestRound, parties } = latestRequest
  const { appealed } = latestRound
  if (!dispute) return false
  const { status, ruling } = dispute

  if (status !== tcrConstants.DISPUTE_STATUS.Appealable && appealed)
    return false

  return (
    (userAccount === parties[tcrConstants.SIDE.Requester] &&
      ruling === tcrConstants.RULING_OPTIONS.Refuse) ||
    (userAccount === parties[tcrConstants.SIDE.Challenger] &&
      ruling === tcrConstants.RULING_OPTIONS.Accept)
  )
}

export const getCrowdfundingInfo = (item) => {
  const { status, latestRequest } = item
  const { dispute, latestRound } = latestRequest
  const {
    appealed,
    hasPaid,
    paidFees,
    requiredForSide,
    appealCost,
  } = latestRound
  const payableValue = !appealCost || (appealCost && appealCost.length < 25) // Contract can return unpayable value to denote that a ruling is not appealable.

  if (
    status <= 1 ||
    !dispute ||
    Number(dispute.status) !== tcrConstants.DISPUTE_STATUS.Appealable ||
    appealed
  )
    return null

  const { ruling } = dispute

  let requesterFeesPercent = 0
  let challengerFeesPercent = 0
  let loserPercent = 0
  let winnerPercent = 0

  requesterFeesPercent = !hasPaid[tcrConstants.SIDE.Requester]
    ? (Number(paidFees[tcrConstants.SIDE.Requester]) /
        Number(requiredForSide[tcrConstants.SIDE.Requester])) *
      100
    : 100

  challengerFeesPercent = !hasPaid[tcrConstants.SIDE.Challenger]
    ? (Number(paidFees[tcrConstants.SIDE.Challenger]) /
        Number(requiredForSide[tcrConstants.SIDE.Challenger])) *
      100
    : 100

  let winnerSide
  let loserSide
  if (ruling === tcrConstants.RULING_OPTIONS.Accept) {
    loserPercent = challengerFeesPercent
    winnerPercent = requesterFeesPercent
    winnerSide = tcrConstants.SIDE.Requester
    loserSide = tcrConstants.SIDE.Challenger
  } else {
    loserPercent = requesterFeesPercent
    winnerPercent = challengerFeesPercent
    winnerSide = tcrConstants.SIDE.Challenger
    loserSide = tcrConstants.SIDE.Requester
  }

  return {
    loserPercent,
    winnerPercent,
    requesterFeesPercent,
    challengerFeesPercent,
    payableValue,
    winnerSide,
    loserSide,
    appealable:
      Number(dispute.status) === tcrConstants.DISPUTE_STATUS.Appealable,
  }
}

export const loserHasPaid = ({ latestRequest }) => {
  const {
    latestRound: { hasPaid },
  } = latestRequest
  const { dispute } = latestRequest
  if (!dispute) return null

  const { ruling } = dispute

  let loserSide
  if (ruling === tcrConstants.RULING_OPTIONS.Accept)
    loserSide = tcrConstants.SIDE.Challenger
  else if (ruling === tcrConstants.RULING_OPTIONS.Refuse)
    loserSide = tcrConstants.SIDE.Requester
  else return null

  return hasPaid[loserSide]
}

export const didLoserTimeout = (item) => {
  const { status, latestRequest } = item
  const { dispute, latestRound } = latestRequest
  if (status <= 1 || !dispute) return false

  const {
    appealed,
    hasPaid,
    paidFees,
    requiredForSide,
    appealPeriod,
  } = latestRound

  if (
    status <= 1 ||
    !dispute ||
    Number(dispute.status) !== tcrConstants.DISPUTE_STATUS.Appealable ||
    !isDecisiveRuling(item) ||
    appealed
  )
    return false

  const { ruling } = dispute

  let requesterFeesPercent = 0
  let challengerFeesPercent = 0
  let loserPercent = 0
  let loserTimedOut

  requesterFeesPercent = !hasPaid[tcrConstants.SIDE.Requester]
    ? (Number(paidFees[tcrConstants.SIDE.Requester]) /
        Number(requiredForSide[tcrConstants.SIDE.Requester])) *
      100
    : 100

  challengerFeesPercent = !hasPaid[tcrConstants.SIDE.Challenger]
    ? (Number(paidFees[tcrConstants.SIDE.Challenger]) /
        Number(requiredForSide[tcrConstants.SIDE.Challenger])) *
      100
    : 100

  loserPercent =
    ruling === tcrConstants.RULING_OPTIONS.Accept
      ? challengerFeesPercent
      : requesterFeesPercent

  const appealPeriodStart = Number(appealPeriod[0])
  let appealPeriodEnd = Number(appealPeriod[1])
  const appealPeriodDuration = (appealPeriodEnd - appealPeriodStart) / 2
  appealPeriodEnd = appealPeriodStart + appealPeriodDuration
  const time = appealPeriodEnd - Date.now()

  if (loserPercent < 100 && time <= 0) loserTimedOut = true

  return loserTimedOut
}

export const getItemInformation = (item, userAccount) => ({
  userSide: getUserSide(item, userAccount),
  userIsLoser: isUserLoser(item, userAccount),
  decisiveRuling: isDecisiveRuling(item),
  loserTimedOut: didLoserTimeout(item),
  loserHasPaid: loserHasPaid(item),
  ...getCrowdfundingInfo(item),
})

export const getBadgeStyle = (badge) => {
  if (badge.status.status === 1)
    return { backgroundImage: `url(${RegisteredBadge})` }
  if (badge.status.disputed && badge.status.status > 1)
    return { backgroundImage: `url(${ChallengedBadge})` }
  return { backgroundImage: `url(${WaitingBadge})`, color: '#656565' }
}

export const toSentenceCase = (input) => {
  input = input ? input.toLowerCase() : ''
  return input.charAt(0).toUpperCase() + input.slice(1)
}

export const capitalizeFirst = (s) =>
  s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : ''

// Truncate with ellipsis in the middle.
export const truncateMiddle = (str) =>
  `${str.slice(0, 6)}...${str.slice(-5, -1)}`

export const getRemainingTime = (
  item,
  tcr,
  tcrConstants,
  losingSide,
  decisiveRuling
) => {
  const currentTime = Date.now()
  const { latestRequest } = item
  const { latestRound } = latestRequest

  if (!tcr) {
    console.warn('No tcr data passed to getRemainingTime.')
    return 0
  }

  let time
  if (latestRequest.parties[2] === ZERO_ADDR)
    time = // Challenge period.
      latestRequest.submissionTime + tcr.challengePeriodDuration - currentTime
  else if (
    latestRequest.dispute.status === tcrConstants.DISPUTE_STATUS.Appealable
  ) {
    if (latestRound.appealPeriod[1] - latestRound.appealPeriod[0] === 94608000)
      return 94608000 // Large value means the arbitrator does not have an appeal period.

    const appealPeriodStart = latestRequest.latestRound.appealPeriod[0]
    let appealPeriodEnd = latestRequest.latestRound.appealPeriod[1]
    let appealPeriodDuration = appealPeriodEnd - appealPeriodStart
    appealPeriodDuration =
      decisiveRuling && losingSide
        ? appealPeriodDuration / 2
        : appealPeriodDuration

    appealPeriodEnd = appealPeriodStart + appealPeriodDuration
    time = appealPeriodEnd - currentTime
  }

  return time > 0 ? time : 0
}

export const userFriendlyLabel = {
  // Translate implementation enum into user friendly label.
  Registered: 'Registered',
  'Registration Requests': 'Submissions',
  'Challenged Registration Requests': 'Challenged Submissions',
  Absent: 'Rejected',
  'Clearing Requests': 'Removal Requests',
  'Challenged Clearing Requests': 'Challenged Removal Requests',
  'My Submissions': 'My Requests',
  'My Challenges': 'My Challenges',
  'Submission Pending': 'Submission Pending',
  'Removal Requested': 'Removal Requested',
  'Submission Challenged': 'Submission Challenged',
  'Removal Request Challenged': 'Removal Request Challenged',
  Added: 'Added',
  'Addition Requested': 'Addition Requested',
  'Addition Challenged': 'Addition Challenged',
  'Removal Challenged': 'Removal Challenged',
  Challenged: 'Challenged',
  Pending: 'Pending',
}

export const rulingMessage = (
  decisiveRuling,
  requesterOrChallenger,
  isLoser,
  ruling
) => {
  if (!decisiveRuling) return 'Jurors did not rule'
  if (!requesterOrChallenger)
    return ruling.toString() === '1'
      ? 'Jurors ruled in favor of the requester'
      : 'Jurors ruled in favor of the challenger'
  return isLoser ? 'Jurors ruled against you' : 'Jurors ruled in your favor'
}

export const truncateETHValue = (str, digits) => {
  if (!str) return 0
  const input = typeof str === 'string' ? str : str.toString()
  if (!input.includes('.')) return input
  return input.slice(0, Math.max(0, input.indexOf('.') + (digits || 5)))
}

export const sanitize = (str) =>
  str
    .toString()
    .toLowerCase()
    .replace(/([^\d.a-z]+)/gi, '-') // Only allow numbers and aplhanumeric.

export const getItemStatusColor = (item) => {
  if (item.inAppealPeriod) return '#4d00b4' // Purple.
  if (item.clientStatus === 0) return '#f60c36' // Red.
  if (item.clientStatus === 1) return '#009aff' // Blue.
  if (item.clientStatus > 3) return '#ff9900' // Orange.
  return '#ccc'
}

export const getItemStatusText = (item) => {
  if (item.inAppealPeriod) return 'Crowdfunding'
  if (item.clientStatus === 0) return 'Rejected'
  if (item.clientStatus === 1) return 'Registered'
  if (item.clientStatus === 2) return 'Registration Requested'
  if (item.clientStatus === 3) return 'Removal Requested'
  return 'Challenged'
}
