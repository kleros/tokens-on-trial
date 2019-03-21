import Web3 from 'web3'
import Archon from '@kleros/archon'

import ArbitrableTokenList from '../assets/contracts/arbitrable-token-list.json'
import ArbitrableAddressList from '../assets/contracts/arbitrable-address-list.json'
import Arbitrator from '../assets/contracts/arbitrator.json'

const env = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'
const requiredNetwork = process.env[`REACT_APP_${env}_NETWORK`]
const WS_PROVIDER = process.env[`REACT_APP_${env}_WS_PROVIDER`]
const HTTP_PROVIDER = process.env[`REACT_APP_${env}_HTTP_PROVIDER`]
const ARBITRABLE_TOKEN_LIST_ADDRESS =
  process.env[`REACT_APP_${env}_ARBITRABLE_TOKEN_LIST_ADDRESS`]
export const ARBITRABLE_ADDRESS_LIST_ADDRESS =
  process.env[`REACT_APP_${env}_ARBITRABLE_ADDRESS_LIST_ADDRESS`]
const ARBITRATOR_ADDRESS = process.env[`REACT_APP_${env}_ARBITRATOR_ADDRESS`]
const FILE_UPLOAD_URL = process.env[`REACT_APP_${env}_FILE_UPLOAD_URL`]
const FILE_BASE_URL = process.env[`REACT_APP_${env}_FILE_BASE_URL`]
const ETHFINEX_CRITERIA_URL =
  process.env[`REACT_APP_${env}_ETHFINEX_CRITERIA_URL`]
const IPFS_URL = process.env[`REACT_APP_${env}_IPFS_URL`]
const APP_VERSION = process.env[`REACT_APP_${env}_VERSION`]
const FROM_BLOCK = process.env[`REACT_APP_${env}_FROM_BLOCK`]

// We have to use 3 different providers:
// 1. web3 - Injected by the browser. If available allows sending transactions
// 2. eventsWeb3 - Since infura no longer supports subscribing to events by http
// we have to use websockets. Unfortunately, websockets are not reliable yet
// as discussed here: https://github.com/INFURA/infura/issues/97,
// and here https://github.com/INFURA/infura/issues/100 so we can't
// rely on it to also view the data.
// 3. viewWeb3 - Uses infura http to view blockchain data.
//
// In short, websockets are only used to receive subscribe to events.

const websocketProvider = new Web3.providers.WebsocketProvider(WS_PROVIDER)
websocketProvider.on('error', () => console.info('WS closed'))
websocketProvider.on('end', () => console.info('WS closed'))
const eventsWeb3 = new Web3(websocketProvider)

const httpProvider = new Web3.providers.HttpProvider(HTTP_PROVIDER)
const viewWeb3 = new Web3(httpProvider)

let web3
let onlyInfura = false
if (process.env.NODE_ENV === 'test')
  web3 = new Web3(require('ganache-cli').provider())
else if (window.ethereum) web3 = new Web3(window.ethereum)
else if (window.web3 && window.web3.currentProvider)
  web3 = new Web3(window.web3.currentProvider)

let network
let arbitrableTokenList
let arbitrableAddressList
let arbitrator
if (!web3) onlyInfura = true
else {
  network =
    web3.eth &&
    web3.eth.net
      .getId()
      .then(networkID => {
        switch (networkID) {
          case 1:
            return 'main'
          case 3:
            return 'ropsten'
          case 4:
            return 'rinkeby'
          case 42:
            return 'kovan'
          default:
            return null
        }
      })
      .catch(() => null)

  arbitrableTokenList = new web3.eth.Contract(
    ArbitrableTokenList.abi,
    ARBITRABLE_TOKEN_LIST_ADDRESS
  )
  arbitrableAddressList = new web3.eth.Contract(
    ArbitrableAddressList.abi,
    ARBITRABLE_ADDRESS_LIST_ADDRESS
  )
  arbitrator = new web3.eth.Contract(Arbitrator.abi, ARBITRATOR_ADDRESS)
}

const archon = new Archon(HTTP_PROVIDER, 'https://ipfs.kleros.io')

const ETHAddressRegExpCaptureGroup = '(0x[a-fA-F0-9]{40})'
const ETHAddressRegExp = /0x[a-fA-F0-9]{40}/
const strictETHAddressRegExp = /^0x[a-fA-F0-9]{40}$/

const arbitrableTokenListView = new viewWeb3.eth.Contract(
  ArbitrableTokenList.abi,
  ARBITRABLE_TOKEN_LIST_ADDRESS
)
const arbitrableAddressListView = new viewWeb3.eth.Contract(
  ArbitrableAddressList.abi,
  ARBITRABLE_ADDRESS_LIST_ADDRESS
)
const arbitratorView = new viewWeb3.eth.Contract(
  Arbitrator.abi,
  ARBITRATOR_ADDRESS
)

const arbitrableTokenListEvents = new eventsWeb3.eth.Contract(
  ArbitrableTokenList.abi,
  ARBITRABLE_TOKEN_LIST_ADDRESS
)
const arbitrableAddressListEvents = new eventsWeb3.eth.Contract(
  ArbitrableAddressList.abi,
  ARBITRABLE_ADDRESS_LIST_ADDRESS
)
const arbitratorEvents = new eventsWeb3.eth.Contract(
  Arbitrator.abi,
  ARBITRATOR_ADDRESS
)

export {
  web3,
  viewWeb3,
  onlyInfura,
  network,
  ETHAddressRegExpCaptureGroup,
  ETHAddressRegExp,
  strictETHAddressRegExp,
  arbitrableTokenList,
  arbitrator,
  arbitrableAddressList,
  FILE_UPLOAD_URL,
  FILE_BASE_URL,
  archon,
  requiredNetwork,
  ETHFINEX_CRITERIA_URL,
  ARBITRATOR_ADDRESS,
  IPFS_URL,
  APP_VERSION,
  arbitrableTokenListView,
  arbitratorView,
  arbitrableAddressListView,
  arbitrableTokenListEvents,
  arbitratorEvents,
  arbitrableAddressListEvents,
  FROM_BLOCK
}
