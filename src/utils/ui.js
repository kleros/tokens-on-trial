// Truncate with ellipsis in the middle.
export const truncateMiddle = str =>
  `${str.slice(0, 6)}...${str.slice(str.length - 5, str.length - 1)}`

export const getRemainingTime = (
  token,
  arbitrableTokenListData,
  currentTime,
  tcrConstants
) => {
  const { latestRequest } = token
  let time
  if (
    !latestRequest.challengerDepositTime ||
    latestRequest.challengerDepositTime === 0
  )
    time =
      latestRequest.submissionTime +
      arbitrableTokenListData.data.challengePeriodDuration -
      currentTime
  else if (latestRequest.disputed === false)
    time =
      latestRequest.challengerDepositTime +
      arbitrableTokenListData.data.arbitrationFeesWaitingTime -
      currentTime
  else if (
    latestRequest.dispute.status ===
    tcrConstants.DISPUTE_STATUS.Appealable.toString()
  ) {
    const appealPeriodEnd =
      Number(latestRequest.latestRound.appealPeriod[1]) * 1000
    time = appealPeriodEnd - currentTime
  }

  return time > 0 ? time : 0
}
