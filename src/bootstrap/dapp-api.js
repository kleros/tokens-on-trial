import Web3 from 'web3'
import Archon from '@kleros/archon'

import ArbitrableTokenList from '../assets/contracts/arbitrable-token-list.json'
import ArbitrableAddressList from '../assets/contracts/arbitrable-address-list.json'
import Arbitrator from '../assets/contracts/kleros-liquid.json'

const env = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'
const ETHEREUM_PROVIDER = process.env[`REACT_APP_${env}_ETHEREUM_PROVIDER`]
const ARBITRABLE_TOKEN_LIST_ADDRESS =
  process.env[`REACT_APP_${env}_ARBITRABLE_TOKEN_LIST_ADDRESS`]
export const ARBITRABLE_ADDRESS_LIST_ADDRESS =
  process.env[`REACT_APP_${env}_ARBITRABLE_ADDRESS_LIST_ADDRESS`]
const ARBITRATOR_ADDRESS = process.env[`REACT_APP_${env}_ARBITRATOR_ADDRESS`]
const FILE_UPLOAD_URL = process.env[`REACT_APP_${env}_FILE_UPLOAD_URL`]
const FILE_BASE_URL = process.env[`REACT_APP_${env}_FILE_BASE_URL`]

let web3
let onlyInfura = false
if (process.env.NODE_ENV === 'test')
  web3 = new Web3(require('ganache-cli').provider())
else if (window.web3 && window.web3.currentProvider)
  web3 = new Web3(window.web3.currentProvider)
else {
  web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_PROVIDER))
  onlyInfura = true
}

const archon = new Archon(ETHEREUM_PROVIDER, 'https://ipfs.kleros.io')

const network =
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

const ETHAddressRegExpCaptureGroup = '(0x[a-fA-F0-9]{40})'
const ETHAddressRegExp = /0x[a-fA-F0-9]{40}/
const strictETHAddressRegExp = /^0x[a-fA-F0-9]{40}$/

const arbitrableTokenList = new web3.eth.Contract(
  ArbitrableTokenList.abi,
  ARBITRABLE_TOKEN_LIST_ADDRESS
)
const arbitrableAddressList = new web3.eth.Contract(
  ArbitrableAddressList.abi,
  ARBITRABLE_ADDRESS_LIST_ADDRESS
)
const arbitrator = new web3.eth.Contract(Arbitrator.abi, ARBITRATOR_ADDRESS)

export {
  web3,
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
  archon
}
