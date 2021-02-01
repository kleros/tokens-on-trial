import { form } from '../../../../../utils/form-generator'
import { required } from '../../../../../utils/validation'

export const {
  Form: ChallengeForm,
  isInvalid: getChallengeFormIsInvalid,
  submit: submitChallengeForm,
} = form('evidenceForm', {
  reason: {
    type: 'text',
    validate: [required],
    props: {
      type: 'textarea',
    },
  },
})
