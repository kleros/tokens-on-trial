import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import reactClickOutside from 'react-click-outside'

import './dropdown.css'
import CheckboxInput from '../checkbox-input'

class Dropdown extends PureComponent {
  static propTypes = {
    // State
    type: PropTypes.oneOf(['radio', 'checkbox']).isRequired,
    label: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          count: PropTypes.number.isRequired,
          color: PropTypes.string
        })
      ]).isRequired
    ).isRequired,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number.isRequired)
    ]).isRequired,

    // Handlers
    onChange: PropTypes.func.isRequired,

    // Modifiers
    inverted: PropTypes.bool,
    className: PropTypes.string
  }

  static defaultProps = {
    // State
    label: null,

    // Modifiers
    inverted: false,
    className: ''
  }

  state = { isOpen: false }

  handleClickOutside = () => {
    const { isOpen } = this.state
    isOpen && this.setState({ isOpen: false })
  }

  handleBoxClick = () => this.setState(state => ({ isOpen: !state.isOpen }))

  handleOptionClick = ({ currentTarget: { id: _id } }) => {
    const idNumber = _id.slice(_id.lastIndexOf('-') + 1)
    const { type, value, onChange } = this.props
    const id = Number(idNumber)
    console.info(idNumber, id)
    const isCheckbox = type === 'checkbox'

    let newValue
    if (isCheckbox) {
      newValue = [...value]
      if (newValue.includes(id)) newValue.splice(newValue.indexOf(id), 1)
      else newValue.push(id)
    } else newValue = id

    this.setState({ isOpen: isCheckbox }, () => onChange(newValue))
  }

  handleSelectAllClick = () => {
    const { options, value, onChange } = this.props
    onChange(value.length === options.length ? [] : options.map((_o, i) => i))
  }

  render() {
    const { type, label, options, value, inverted, className } = this.props
    const { isOpen } = this.state

    const isCheckbox = type === 'checkbox'
    return (
      <div
        className={`Dropdown ${isCheckbox ? 'Dropdown--checkbox' : ''} ${
          inverted ? 'Dropdown--inverted' : ''
        } ${isOpen ? 'is-open' : ''} ${className}`}
      >
        <div className="Dropdown-box" onClick={this.handleBoxClick}>
          {isCheckbox ? <span>&nbsp;&nbsp;{label}</span> : options[value]}
          <FontAwesomeIcon className="Dropdown-box-caret" icon="caret-down" />
        </div>
        {isOpen && (
          <div className="Dropdown-options">
            {isCheckbox && (
              <div
                className="Dropdown-options-option Dropdown-options-option--selectAll"
                id="select-all"
                key="select-all"
                onClick={this.handleSelectAllClick}
              >
                {value.length === options.length ? 'UN' : ''}SELECT ALL
              </div>
            )}
            {options.map((o, i) => {
              const isActive = isCheckbox ? value.includes(i) : value === i
              return (
                <div
                  className={`Dropdown-options-option ${
                    isActive ? 'is-active' : ''
                  }`}
                  id={i}
                  key={i}
                  onClick={this.handleOptionClick}
                >
                  {isCheckbox ? (
                    <CheckboxInput
                      label={o.label || o}
                      input={{
                        value: isActive,
                        onChange: this.handleOptionClick
                      }}
                      customKey={i}
                    />
                  ) : (
                    o.label || o
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
}

export default reactClickOutside(Dropdown)
