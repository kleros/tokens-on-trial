import React from 'react'
import PropTypes from 'prop-types'
import './eth-input.css'

const ETHInput = ({
  input: { value, onBlur, onChange },
  meta: { touched, valid, error },
  placeholder,
  step,
  className,
}) => (
  <div style={{ width: '100%', display: 'flex', position: 'relative' }}>
    <div
      className={`ETHInput ${
        error && touched ? 'is-error' : valid ? 'is-valid' : ''
      } ${className}`}
    >
      <input
        className="ETHInput-input"
        onBlur={onBlur}
        onChange={onChange}
        step={step}
        type="number"
        value={value}
      />
      {placeholder && (
        <div
          className={`ETHInput-placeholder${
            touched || (value !== undefined && value !== null && value !== '')
              ? ' is-touched'
              : ''
          }`}
        >
          {placeholder}
        </div>
      )}
      {error && touched && <div className="ETHInput-error">{error}</div>}
    </div>
    <label style={{ position: 'absolute', right: '24px', top: '15px' }}>
      ETH
    </label>
  </div>
)

ETHInput.propTypes = {
  // Redux Form
  input: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onBlur: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    valid: PropTypes.bool,
    error: PropTypes.string,
  }),

  // State
  placeholder: PropTypes.oneOfType([PropTypes.element, PropTypes.string])
    .isRequired,

  // Modifiers
  step: PropTypes.number,
  className: PropTypes.string,
}

ETHInput.defaultProps = {
  // Redux Form
  meta: {},

  // Modifiers
  step: undefined,
  className: '',
}

export default ETHInput
