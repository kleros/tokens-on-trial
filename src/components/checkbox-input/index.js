import React from 'react'
import PropTypes from 'prop-types'
import './checkbox-input.css'

const CheckboxInput = ({
  input: { value, onChange },
  label,
  className,
  customKey
}) => (
  <div className={`CheckboxInput ${className}`}>
    <div className="CheckboxInput-checkbox">
      <input
        checked={value}
        id={`chk-${label}-${customKey}`}
        onChange={onChange}
        type="checkbox"
      />
      <label
        className={`CheckboxInput-checkbox-overlay ${
          value === true ? 'CheckboxInput-checkbox-marked' : ''
        }`}
        htmlFor={`chk-${label}-${customKey}`}
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
  customKey: PropTypes.string,

  // Modifiers
  className: PropTypes.string
}

CheckboxInput.defaultProps = {
  // Modifiers
  label: '',
  className: '',
  customKey: ''
}

export default CheckboxInput
