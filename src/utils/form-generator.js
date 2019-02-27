import createReduxForm from 'create-redux-form'

import TextInput from '../components/text-input'
import ETHInput from '../components/eth-input'
import CheckboxInput from '../components/checkbox-input'

export const { form, wizardForm } = createReduxForm({
  text: TextInput,
  checkbox: CheckboxInput,
  eth: ETHInput
})
