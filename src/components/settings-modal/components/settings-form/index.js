import { form } from '../../../../utils/form-generator'
import { email, required } from '../../../../utils/validation'

export const { Form: SettingsForm, submit: submitSettingsForm } = form(
  'settingsForm',
  {
    dispute: {
      type: 'checkbox',
      props: {
        label: 'Your request was challenged'
      }
    },
    rulingGiven: {
      type: 'checkbox',
      props: {
        label: 'A ruling was given.'
      }
    },
    fullName: { type: 'text', validate: [required] },
    email: {
      type: 'text',
      validate: [required, email]
    }
  }
)
