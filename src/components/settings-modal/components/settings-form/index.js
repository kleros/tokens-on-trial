import { form } from '../../../../utils/form-generator'
import { email, required } from '../../../../utils/validation'

export const { Form: SettingsForm, submit: submitSettingsForm } = form(
  'settingsForm',
  {
    dispute: {
      type: 'checkbox',
      props: {
        label: 'Someone challenges my request'
      }
    },
    rulingGiven: {
      type: 'checkbox',
      props: {
        label: 'The arbitrator gives a ruling in my dispute'
      }
    },
    fullName: { type: 'text', validate: [required] },
    email: {
      type: 'text',
      validate: [required, email]
    }
  }
)
