## Token² Curated List

### Is an item on the list?

The Token² Curated List implements [Permission Interface](https://github.com/kleros/kleros-interaction/blob/master/contracts/standard/permission/PermissionInterface.sol). This means anyone can check if a token is on the list by calling `isPermitted(bytes32 _value)` where `_value` is the `keccac256` hash of the token's [tighly packed](https://solidity.readthedocs.io/en/develop/abi-spec.html#non-standard-packed-mode) data:

- name
- ticker
- address // The token's Ethereum address, if it is running on an EVM based network.
- symbolMultihash // Multihash of the token's symbol image.
- networkID // The ID of the token's network. ETH if the token is deployed on the Ethereum mainnet.

This can be computed with web3js 1.0 [`soliditySha3()`](https://web3js.readthedocs.io/en/1.0/web3-utils.html?highlight=soliditySha3#soliditysha3) function. See example below:

```
const ID = web3.utils.soliditySha3(
    'Pinakion',
    'PNK',
    '0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d',
    '0x9638d9a8ac3eceb75dac165d34448d13fbb7b079a22aabe70309b23616ef35cc',
    'ETH'
)
```

> **Tip**: You can use the [archon](https://archon.readthedocs.io/en/latest/hashing.html) library provided by Kleros to calculate multihashes:

`const fileMultihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256`
