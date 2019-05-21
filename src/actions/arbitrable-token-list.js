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
  ...createActions('TOKEN_EVIDENCE', { withCreate: true })
}
export const submitTokenEvidence = ({
  file,
  evidenceData,
  ID,
  evidenceSide
}) => ({
  type: tokenEvidence.CREATE,
  payload: { file, evidenceData, ID, evidenceSide }
})
