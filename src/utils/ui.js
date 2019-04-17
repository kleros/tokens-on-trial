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

export const isDecisiveRuling = item => {
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

export const getCrowdfundingInfo = item => {
  const { status, latestRequest } = item
  const { dispute, latestRound } = latestRequest
  const { appealed, hasPaid, paidFees, requiredForSide } = latestRound

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

  if (!hasPaid[tcrConstants.SIDE.Requester])
    requesterFeesPercent =
      (Number(paidFees[tcrConstants.SIDE.Requester]) /
        Number(requiredForSide[tcrConstants.SIDE.Requester])) *
      100
  else requesterFeesPercent = 100

  if (!hasPaid[tcrConstants.SIDE.Challenger])
    challengerFeesPercent =
      (Number(paidFees[tcrConstants.SIDE.Challenger]) /
        Number(requiredForSide[tcrConstants.SIDE.Challenger])) *
      100
  else challengerFeesPercent = 100

  if (ruling === tcrConstants.RULING_OPTIONS.Accept)
    loserPercent = challengerFeesPercent
  else loserPercent = requesterFeesPercent

  return {
    loserPercent,
    requesterFeesPercent,
    challengerFeesPercent
  }
}

export const loserHasPaid = ({ latestRequest }) => {
  const {
    latestRound: { hasPaid }
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

export const didLoserTimeout = item => {
  const { status, latestRequest } = item
  const { dispute, latestRound } = latestRequest
  if (status <= 1 || !dispute) return false

  const {
    appealed,
    hasPaid,
    paidFees,
    requiredForSide,
    appealPeriod
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

  if (!hasPaid[tcrConstants.SIDE.Requester])
    requesterFeesPercent =
      (Number(paidFees[tcrConstants.SIDE.Requester]) /
        Number(requiredForSide[tcrConstants.SIDE.Requester])) *
      100
  else requesterFeesPercent = 100

  if (!hasPaid[tcrConstants.SIDE.Challenger])
    challengerFeesPercent =
      (Number(paidFees[tcrConstants.SIDE.Challenger]) /
        Number(requiredForSide[tcrConstants.SIDE.Challenger])) *
      100
  else challengerFeesPercent = 100

  if (ruling === tcrConstants.RULING_OPTIONS.Accept)
    loserPercent = challengerFeesPercent
  else loserPercent = requesterFeesPercent

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
  ...getCrowdfundingInfo(item)
})

export const getBadgeStyle = badge => {
  if (badge.status.status === 1)
    return { backgroundImage: `url(${RegisteredBadge})` }
  if (badge.status.disputed && badge.status.status > 1)
    return { backgroundImage: `url(${ChallengedBadge})` }
  return { backgroundImage: `url(${WaitingBadge})`, color: '#656565' }
}

export const toSentenceCase = input => {
  input = input ? input.toLowerCase() : ''
  return input.charAt(0).toUpperCase() + input.slice(1)
}

export const capitalizeFirst = s =>
  s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : ''

// Truncate with ellipsis in the middle.
export const truncateMiddle = str =>
  `${str.slice(0, 6)}...${str.slice(str.length - 5, str.length - 1)}`

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
  'Removal Challenged': 'Removal Challenged'
}

export const rulingMessage = (
  decisiveRuling,
  requesterOrChallenger,
  isLoser,
  ruling
) => {
  if (!decisiveRuling) return 'Jurors did not rule'
  if (!requesterOrChallenger)
    return ruling === '1'
      ? 'Jurors ruled in favor of the requester'
      : 'Jurors ruled in favor of the challenger'
  if (isLoser) return 'Jurors ruled against you'
  else return 'Jurors ruled in your favor'
}

export const truncateETHValue = str => {
  if (str.indexOf('.') === -1) return str
  return str.substring(0, str.indexOf('.') + 5)
}

export const sanitize = str => {
  const a = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœṕŕßśșțùúüûǘẃẍÿź·/_,:;'
  const b = 'aaaaaaaaceeeeghiiiimnnnoooooprssstuuuuuwxyz------'
  const p = new RegExp(a.split('').join('|'), 'g')
  return str
    .toString()
    .toLowerCase()
    .replace(/#/g, '-') // Replace all # with -
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with ‘and’
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}
