import { createActions } from 'lessdux'

/* Actions */

// Arbitrable Token List Data
export const arbitrableTokenListData = createActions(
  'ARBITRABLE_TOKEN_LIST_DATA'
)
export const fetchArbitrableTokenListData = () => ({
  type: arbitrableTokenListData.FETCH
})

// Evidence submission
export const tokenEvidence = {
  ...createActions('EVIDENCE', { withCreate: true })
}
export const submitTokenEvidence = ({ file, evidenceData, ID, fileData }) => ({
  type: tokenEvidence.CREATE,
  payload: { file, evidenceData, ID, fileData }
})
