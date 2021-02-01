import { form } from '../../../../../utils/form-generator'
import { required, isPositiveNumber } from '../../../../../utils/validation'

export const {
  Form: AppealForm,
  isInvalid: getAppealFormIsInvalid,
  submit: submitAppealForm,
} = form('appealForm', {
  amount: {
    type: 'eth',
    validate: [required, isPositiveNumber],
  },
})
