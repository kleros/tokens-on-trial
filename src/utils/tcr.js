import Web3 from 'web3'
import Archon from '@kleros/archon'

import * as tcrConstants from '../constants/tcr'
import ArbitrableTokenList from '../assets/contracts/arbitrable-token-list'
import ArbitrableAddressList from '../assets/contracts/arbitrable-address-list'
import badgeTCRs from '../assets/badge-addresses.json'
import Arbitrator from '../assets/contracts/arbitrator'
import _arbitrableTCRView from '../assets/contracts/arbitrable-tcr-view-abi.json'
import { network as networkPromise, web3Utils } from '../bootstrap/dapp-api'

const { toBN } = web3Utils

export const instantiateEnvObjects = async () => {
  const networkID = networkPromise ? await networkPromise : 1
  const env = networkID === 1 ? 'PROD' : 'DEV'

  // We have to use 3 different providers:
  // 1. web3 - Injected by the browser. If available allows sending transactions
  // 2. eventsWeb3 - Since infura no longer supports subscribing to events by http
  // we have to use websockets. Unfortunately, websockets are not reliable yet
  // as discussed here: https://github.com/INFURA/infura/issues/97,
  // and here https://github.com/INFURA/infura/issues/100 so we can't
  // rely on it to also view the data.
  // 3. viewWeb3 - Uses infura http to view blockchain data.
  //
  // In short, websockets are only used to subscribe to events.
  const WS_PROVIDER = process.env[`REACT_APP_${env}_WS_PROVIDER`]
  const HTTP_PROVIDER = process.env[`REACT_APP_${env}_HTTP_PROVIDER`]
  const ARBITRABLE_TOKEN_LIST_ADDRESS =
    process.env[`REACT_APP_${env}_ARBITRABLE_TOKEN_LIST_ADDRESS`]
  const ARBITRATOR_ADDRESS = process.env[`REACT_APP_${env}_ARBITRATOR_ADDRESS`]
  const ARBITRABLE_TCR_VIEW_ADDRESS =
    process.env[`REACT_APP_${env}_ARBITRABLE_TCR_VIEW_ADDRESS`]
  const FILE_UPLOAD_URL = process.env[`REACT_APP_${env}_FILE_UPLOAD_URL`]
  const FILE_BASE_URL = process.env[`REACT_APP_${env}_FILE_BASE_URL`]
  const T2CR_BLOCK = process.env[`REACT_APP_${env}_T2CR_BLOCK`]
  const ARBITRATOR_BLOCK = process.env[`REACT_APP_${env}_ARBITRATOR_BLOCK`]
  const archon = new Archon(HTTP_PROVIDER, 'https://ipfs.kleros.io')

  const httpProvider = new Web3.providers.HttpProvider(HTTP_PROVIDER)
  const websocketProvider = new Web3.providers.WebsocketProvider(WS_PROVIDER)
  websocketProvider.on('error', () => console.info('WS closed'))
  websocketProvider.on('end', () => console.info('WS closed'))

  let eventsWeb3 = new Web3(websocketProvider)
  let viewWeb3 = new Web3(httpProvider)

  let arbitrableTokenList
  let badgeContracts = {}
  let arbitrator
  let web3
  if (window.ethereum) {
    web3 = new Web3(window.ethereum)

    // If window.web3 is available, also use it for viewing and event subscription.
    viewWeb3 = web3
    eventsWeb3 = web3

    arbitrator = new web3.eth.Contract(Arbitrator.abi, ARBITRATOR_ADDRESS)

    arbitrableTokenList = new web3.eth.Contract(
      ArbitrableTokenList.abi,
      ARBITRABLE_TOKEN_LIST_ADDRESS
    )
    if (badgeTCRs[networkID])
      badgeContracts = badgeTCRs[networkID]
        .map(
          address =>
            new viewWeb3.eth.Contract(ArbitrableAddressList.abi, address)
        )
        .reduce((acc, contract) => {
          acc[contract.options.address] = contract
          return acc
        }, {})
  }

  const arbitrableTokenListView = new viewWeb3.eth.Contract(
    ArbitrableTokenList.abi,
    ARBITRABLE_TOKEN_LIST_ADDRESS
  )
  const arbitratorView = new viewWeb3.eth.Contract(
    Arbitrator.abi,
    ARBITRATOR_ADDRESS
  )
  const arbitrableTCRView = new viewWeb3.eth.Contract(
    _arbitrableTCRView,
    ARBITRABLE_TCR_VIEW_ADDRESS
  )

  let badgeViewContracts = {}
  if (badgeTCRs[networkID])
    badgeViewContracts = badgeTCRs[networkID]
      .map(
        address => new viewWeb3.eth.Contract(ArbitrableAddressList.abi, address)
      )
      .reduce((acc, contract) => {
        acc[web3Utils.toChecksumAddress(contract.options.address)] = contract
        return acc
      }, {})

  const arbitrableTokenListEvents = new eventsWeb3.eth.Contract(
    ArbitrableTokenList.abi,
    ARBITRABLE_TOKEN_LIST_ADDRESS
  )
  const arbitratorEvents = new eventsWeb3.eth.Contract(
    Arbitrator.abi,
    ARBITRATOR_ADDRESS
  )

  let badgeEventsContracts = {}
  if (badgeTCRs[networkID])
    badgeEventsContracts = badgeTCRs[networkID]
      .map(
        address =>
          new eventsWeb3.eth.Contract(ArbitrableAddressList.abi, address)
      )
      .reduce((acc, contract) => {
        acc[web3Utils.toChecksumAddress(contract.options.address)] = contract
        return acc
      }, {})

  const latestBlock = (await viewWeb3.eth.getBlock('latest')).number

  return {
    arbitrableTokenList,
    badgeContracts,
    arbitrator,
    arbitrableTokenListView,
    badgeViewContracts,
    arbitratorView,
    arbitrableTokenListEvents,
    badgeEventsContracts,
    arbitratorEvents,
    FILE_UPLOAD_URL,
    FILE_BASE_URL,
    T2CR_BLOCK,
    ARBITRATOR_BLOCK,
    archon,
    ARBITRATOR_ADDRESS,
    ARBITRABLE_TOKEN_LIST_ADDRESS,
    web3,
    viewWeb3,
    eventsWeb3,
    networkID,
    badgeTCRs: badgeTCRs[networkID],
    latestBlock,
    arbitrableTCRView
  }
}

export const hasPendingRequest = ({ status, clientStatus, latestRequest }) => {
  if (clientStatus === tcrConstants.STATUS_ENUM.Pending) return true
  if (latestRequest && latestRequest.disputed && !latestRequest.resolved)
    return true

  switch (status) {
    case tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']:
    case tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']:
      return true
    default:
      break
  }

  return false
}

export const isRegistrationRequest = tokenStatus =>
  tokenStatus === tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']

export const contractStatusToClientStatus = (status, disputed) => {
  if (disputed)
    switch (tcrConstants.IN_CONTRACT_STATUS_ENUM[status]) {
      case 'RegistrationRequested':
        return tcrConstants.STATUS_ENUM['Submission Challenged']
      case 'ClearingRequested':
        return tcrConstants.STATUS_ENUM['Removal Request Challenged']
      default:
        return Number(status)
    }

  return Number(status)
}

export const getBlock = (block, web3, hash, callback) => {
  if (!block || !block.timestamp)
    // Due to a web3js bug, this method sometimes returns a null block
    // https://github.com/paritytech/parity-ethereum/issues/8788.
    web3.eth.getBlock(hash, (err, block) => {
      if (err) throw err
      getBlock(block, web3, hash, callback)
    })
  else callback(block)
}

// Converts item string data to correct js types.
export const convertFromString = item => {
  const { latestRequest } = item
  item.numberOfRequests = Number(item.numberOfRequests)
  latestRequest.numberOfRounds = Number(latestRequest.numberOfRounds)
  latestRequest.disputeID = latestRequest.dispute
    ? Number(latestRequest.disputeID)
    : 0
  latestRequest.appealDisputeID =
    Number(latestRequest.numberOfRounds) > 1
      ? Number(latestRequest.appealDisputeID)
      : 0

  item.requests = item.requests.map(request => ({
    ...request,
    submissionTime: Number(request.submissionTime) * 1000,
    ruling: Number(request.ruling)
  }))
  latestRequest.submissionTime = Number(latestRequest.submissionTime) * 1000

  if (latestRequest.dispute) {
    latestRequest.dispute.ruling = Number(latestRequest.dispute.ruling)
    latestRequest.dispute.status = Number(latestRequest.dispute.status)
    latestRequest.dispute.period = Number(latestRequest.dispute.period)
    latestRequest.dispute.court.timesPerPeriod[0] =
      Number(latestRequest.dispute.court.timesPerPeriod[0]) * 1000
    latestRequest.dispute.court.timesPerPeriod[1] =
      Number(latestRequest.dispute.court.timesPerPeriod[1]) * 1000
    latestRequest.dispute.court.timesPerPeriod[2] =
      Number(latestRequest.dispute.court.timesPerPeriod[2]) * 1000
    latestRequest.dispute.court.timesPerPeriod[3] =
      Number(latestRequest.dispute.court.timesPerPeriod[3]) * 1000
    latestRequest.dispute.lastPeriodChange =
      Number(latestRequest.dispute.lastPeriodChange) * 1000
  }

  const { latestRound } = latestRequest
  if (
    latestRequest.dispute &&
    latestRequest.dispute.status === tcrConstants.DISPUTE_STATUS.Appealable &&
    !latestRequest.latestRound.appealed
  ) {
    latestRound.appealPeriod[0] = Number(latestRound.appealPeriod[0]) * 1000
    latestRound.appealPeriod[1] = Number(latestRound.appealPeriod[1]) * 1000

    latestRound.paidFees[0] = toBN(latestRound.paidFees[0])
    latestRound.paidFees[1] = toBN(latestRound.paidFees[1])
    latestRound.paidFees[2] = toBN(latestRound.paidFees[2])
  }

  item.latestRound = latestRound
  return item
}
