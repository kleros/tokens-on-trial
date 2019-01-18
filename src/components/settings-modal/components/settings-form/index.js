import { form } from '../../../../utils/form-generator'
import { email, required } from '../../../../utils/validation'

export const { Form: SettingsForm, submit: submitSettingsForm } = form(
  'settingsForm',
  {
    executeReady: {
      type: 'checkbox',
      props: {
        label: 'Your request is ready to be executed.'
      }
    },
    challenged: {
      type: 'checkbox',
      props: {
        label: 'Your request was challenged'
      }
    },
    shouldFund: {
      type: 'checkbox',
      props: {
        label: `It's your turn to fund a dispute`
      }
    },
    rulingGiven: {
      type: 'checkbox',
      props: {
        label: 'A ruling was given.'
      }
    },
    name: { type: 'text', validate: [required] },
    email: {
      type: 'text',
      validate: [required, email]
    }
  }
)
