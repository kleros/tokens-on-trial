import { form } from '../../../../utils/form-generator'
import { email, required } from '../../../../utils/validation'

export const {
  Form: SettingsForm,
  submit: submitSettingsForm,
  isInvalid: getSettingsFormIsInvalid
} = form('settingsForm', {
  dispute: {
    type: 'checkbox',
    props: {
      label: 'Someone challenges my request'
    }
  },
  rulingGiven: {
    type: 'checkbox',
    props: {
      label: 'Jurors give a ruling in my dispute'
    }
  },
  fullName: { type: 'text', validate: [required] },
  email: {
    type: 'text',
    validate: [required, email]
  }
})
