import RegisteredBadge from '../assets/images/badges/badge-registered.svg'
import ChallengedBadge from '../assets/images/badges/badge-challenged.svg'
import WaitingBadge from '../assets/images/badges/badge-waiting.svg'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

export const getBadgeStyle = badge => {
  if (badge.status.status === 1)
    return { backgroundImage: `url(${RegisteredBadge})` }
  if (badge.status.disputed && badge.status.status > 1)
    return { backgroundImage: `url(${ChallengedBadge})` }
  return { backgroundImage: `url(${WaitingBadge})`, color: '#656565' }
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

  if (!tcr.data) {
    console.warn('No tcr data passed to getRemainingTime.')
    return 0
  }

  let time
  if (latestRequest.parties[2] === ZERO_ADDR)
    time =
      latestRequest.submissionTime +
      tcr.data.challengePeriodDuration -
      currentTime
  else if (
    latestRequest.dispute.status ===
    tcrConstants.DISPUTE_STATUS.Appealable.toString()
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
  Absent: 'Removed',
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
