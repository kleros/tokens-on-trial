import RegisteredBadge from '../assets/images/badges/badge-registered.svg'
import ChallengedBadge from '../assets/images/badges/badge-challenged.svg'
import WaitingBadge from '../assets/images/badges/badge-waiting.svg'

export const getBadgeStyle = (badge, tcrConstants) => {
  if (badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'])
    return { backgroundImage: `url(${RegisteredBadge})` }
  if (badge.latestRequest.disputed && !badge.latestRequest.resolved)
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
  if (
    !latestRequest.challengerDepositTime ||
    latestRequest.challengerDepositTime === 0
  )
    time =
      latestRequest.submissionTime +
      tcr.data.challengePeriodDuration -
      currentTime
  else if (latestRequest.disputed === false)
    time =
      latestRequest.challengerDepositTime +
      tcr.data.arbitrationFeesWaitingTime -
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
