import { form } from '../../../../utils/form-generator'
import { email, required } from '../../../../utils/validation'

export const { Form: SettingsForm, submit: submitSettingsForm } = form(
  'settingsForm',
  {
    challenged: {
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
    appealFunded: {
      type: 'checkbox',
      props: {
        label: 'An adversary funded his side of an appeal.'
      }
    },
    name: { type: 'text', validate: [required] },
    email: {
      type: 'text',
      validate: [required, email]
    }
  }
)
