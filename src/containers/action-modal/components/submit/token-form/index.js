import { form } from '../../../../../utils/form-generator'
import { ETHAddress, required } from '../../../../../utils/validation'

export const {
  Form: TokenForm,
  isInvalid: getTokenFormIsInvalid,
  submit: submitTokenForm
} = form('tokenForm', {
  name: {
    type: 'text',
    validate: [required]
  },
  addr: {
    type: 'text',
    validate: [required, ETHAddress]
  },
  ticker: {
    type: 'text',
    validate: [required]
  }
})
