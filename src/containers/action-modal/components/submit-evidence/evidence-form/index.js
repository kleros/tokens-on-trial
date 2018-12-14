import { form } from '../../../../../utils/form-generator'
import { required } from '../../../../../utils/validation'

export const {
  Form: EvidenceForm,
  isInvalid: getEvidenceFormIsInvalid,
  submit: submitEvidenceForm
} = form('evidenceForm', {
  name: {
    type: 'text',
    validate: [required]
  },
  description: {
    type: 'text',
    validate: [required],
    props: {
      type: 'textarea'
    }
  }
})
