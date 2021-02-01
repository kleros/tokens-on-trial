import { form } from '../../../../../utils/form-generator'
import {
  ETHAddress,
  required,
  notEmptyAddress,
} from '../../../../../utils/validation'

export const {
  Form: TokenForm,
  isInvalid: getTokenFormIsInvalid,
  submit: submitTokenForm,
} = form('tokenForm', {
  name: {
    type: 'text',
    validate: [required],
    props: { placeholder: 'Name' },
  },
  address: {
    type: 'text',
    validate: [required, ETHAddress, notEmptyAddress],
    props: { placeholder: 'Address' },
  },
  ticker: {
    type: 'text',
    validate: [required],
    props: { placeholder: 'Ticker' },
  },
})
