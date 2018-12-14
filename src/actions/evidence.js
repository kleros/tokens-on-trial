import { createActions } from 'lessdux'

/* Actions */
export const evidence = { ...createActions('EVIDENCE', { withCreate: true }) }

/* Action Creators */
export const submitEvidence = ({ file, evidenceData, ID, fileData }) => ({
  type: evidence.CREATE,
  payload: { file, evidenceData, ID, fileData }
})
