import { form } from '../../../../../utils/form-generator'
import { ETHAddress, required } from '../../../../../utils/validation'

export const {
  Form: TokenForm,
  isInvalid: getTokenFormIsInvalid,
  submit: submitTokenForm
} = form('tokenForm', {
  name: {
    type: 'text',
    validate: [required],
    props: { placeholder: 'Name' }
  },
  addr: {
    type: 'text',
    validate: [required, ETHAddress],
    props: { placeholder: 'Address' }
  },
  ticker: {
    type: 'text',
    validate: [required],
    props: { placeholder: 'Ticker' }
  }
})
