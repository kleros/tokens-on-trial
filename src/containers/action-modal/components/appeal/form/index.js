import { form } from '../../../../../utils/form-generator'
import { required, isNumber } from '../../../../../utils/validation'

export const {
  Form: AppealForm,
  isInvalid: getAppealFormIsInvalid,
  submit: submitAppealForm
} = form('appealForm', {
  amount: {
    type: 'eth',
    validate: [required, isNumber]
  }
})
