import React from 'react'
import PropTypes from 'prop-types'

import './checkbox-input.css'

const CheckboxInput = ({ input: { value, onChange }, label, className }) => (
  <div className={`CheckboxInput ${className}`}>
    <div className="CheckboxInput-checkbox">
      <input
        id={`chk-${label}`}
        onChange={onChange}
        type="checkbox"
        checked={value}
      />
      <label
        htmlFor={`chk-${label}`}
        className={`CheckboxInput-checkbox-overlay ${
          value === true ? 'CheckboxInput-checkbox-marked' : ''
        }`}
      />
    </div>
    {label}
  </div>
)

CheckboxInput.propTypes = {
  // Redux Form
  input: PropTypes.shape({
    value: PropTypes.bool,
    onChange: PropTypes.func.isRequired
  }).isRequired,
  label: PropTypes.string,

  // Modifiers
  className: PropTypes.string
}

CheckboxInput.defaultProps = {
  // Modifiers
  label: '',
  className: ''
}

export default CheckboxInput
