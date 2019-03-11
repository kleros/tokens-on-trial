import { ADD_TOKENS } from '../actions/tokens'

const tokens = (state = { blockHeight: 0 }, action) => {
  switch (action.type) {
    case ADD_TOKENS: {
      const { tokens, blockHeight } = action.payload
      console.info('ttt', tokens)
      console.info('bb', blockHeight)
      return {
        ...tokens,
        blockHeight
      }
    }
    default:
      return state
  }
}

export default tokens
