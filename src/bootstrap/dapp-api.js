import Web3 from 'web3'

const ETHAddressRegExpCaptureGroup = '(0x[a-fA-F0-9]{40})'
const ETHAddressRegExp = /0x[a-fA-F0-9]{40}/
const strictETHAddressRegExp = /^0x[a-fA-F0-9]{40}$/

const web3Utils = new Web3().utils
let web3
let onlyInfura = false
if (process.env.NODE_ENV === 'test')
  web3 = new Web3(require('ganache-cli').provider())
else if (window.ethereum) web3 = new Web3(window.ethereum)
else if (window.web3 && window.web3.currentProvider)
  web3 = new Web3(window.web3.currentProvider)

const network = web3 && web3.eth && web3.eth.net.getId()
if (!web3) onlyInfura = true

const ETHFINEX_CRITERIA_URL = process.env[`REACT_APP_ETHFINEX_CRITERIA_URL`]
const IPFS_URL = process.env[`REACT_APP_IPFS_URL`]
const APP_VERSION = process.env[`REACT_APP_VERSION`]

export {
  network,
  ETHAddressRegExpCaptureGroup,
  ETHAddressRegExp,
  strictETHAddressRegExp,
  ETHFINEX_CRITERIA_URL,
  IPFS_URL,
  onlyInfura,
  APP_VERSION,
  web3Utils
}
