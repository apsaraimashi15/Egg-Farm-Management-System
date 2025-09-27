import React, { useState, useEffect } from 'react'

const CardPaymentForm = ({ cardDetails, fieldErrors, onChange, onValidationChange }) => {
  const [expiryMonth, setExpiryMonth] = useState(cardDetails.expiryMonth || '')
  const [expiryYear, setExpiryYear] = useState(cardDetails.expiryYear || '')
  const [touchedFields, setTouchedFields] = useState({})
  const [fieldValidity, setFieldValidity] = useState({})
  const [cardType, setCardType] = useState('')

  // Card type detection
  const detectCardType = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '')

    if (/^4/.test(number)) return 'visa'
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard'
    if (/^3[47]/.test(number)) return 'amex'
    if (/^6(?:011|5)/.test(number)) return 'discover'

    return ''
  }

  // Luhn algorithm for card number validation
  const validateLuhn = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '')
    let sum = 0
    let shouldDouble = false

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10)

      if (shouldDouble) {
        digit *= 2
        if (digit > 9) digit -= 9
      }

      sum += digit
      shouldDouble = !shouldDouble
    }

    return sum % 10 === 0
  }

  // Card number validation
  const validateCardNumber = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '')
    const type = detectCardType(cardNumber)

    if (!type) return false
    if (number.length < 13 || number.length > 19) return false

    return validateLuhn(cardNumber)
  }

  // Expiry date validation
  const validateExpiryDate = (month, year) => {
    if (!month || !year) return false

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const expYear = parseInt(year, 10)
    const expMonth = parseInt(month, 10)

    if (expYear < currentYear) return false
    if (expYear === currentYear && expMonth < currentMonth) return false

    return true
  }

  // CVV validation based on card type
  const validateCVV = (cvv, cardType) => {
    if (!cvv) return false

    if (cardType === 'amex') {
      return /^\d{4}$/.test(cvv)
    }

    return /^\d{3}$/.test(cvv)
  }

  // Name validation
  const validateCardholderName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s\-'.]+$/.test(name.trim())
  }

  const validateField = (name, value) => {
    let isValid = false

    switch (name) {
      case 'cardholderName':
        isValid = validateCardholderName(value)
        break
      case 'cardNumber':
        isValid = validateCardNumber(value)
        setCardType(detectCardType(value))
        break
      case 'expiryDate':
        isValid = validateExpiryDate(expiryMonth, expiryYear)
        break
      case 'cvv':
        isValid = validateCVV(value, cardType)
        break
      default:
        isValid = true
    }

    return isValid
  }

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    onChange(e)

    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }))

    // Special handling for expiry date
    if (name === 'expiryDate') {
      const isValid = validateExpiryDate(expiryMonth, expiryYear)
      setFieldValidity(prev => ({ ...prev, [name]: isValid }))

      if (onValidationChange) {
        onValidationChange(name, isValid, '')
      }
    } else {
      // Validate other fields
      const isValid = validateField(name, value)
      setFieldValidity(prev => ({ ...prev, [name]: isValid }))

      if (onValidationChange) {
        onValidationChange(name, isValid, '')
      }
    }
  }

  const handleFieldBlur = (e) => {
    const { name, value } = e.target
    setTouchedFields(prev => ({ ...prev, [name]: true }))

    const isValid = validateField(name, value)
    setFieldValidity(prev => ({ ...prev, [name]: isValid }))

    if (onValidationChange) {
      onValidationChange(name, isValid, '')
    }
  }
  const handleCardholderNameChange = (e) => {
    const value = e.target.value
    // Only allow letters, spaces, hyphens, apostrophes, and periods
    const filteredValue = value.replace(/[^a-zA-Z\s\-'.]/g, '')

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'cardholderName',
        value: filteredValue
      }
    }

    handleFieldChange(syntheticEvent)
  }

  const handleCardNumberChange = (e) => {
    const value = e.target.value
    // Only allow numbers and spaces, format with spaces every 4 digits
    let filteredValue = value.replace(/[^\d]/g, '')

    // Add spaces every 4 digits
    filteredValue = filteredValue.replace(/(\d{4})(?=\d)/g, '$1 ')

    // Limit to 19 digits + 4 spaces = 23 characters max
    if (filteredValue.replace(/\s/g, '').length > 19) {
      filteredValue = filteredValue.substring(0, 23)
    }

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'cardNumber',
        value: filteredValue
      }
    }

    handleFieldChange(syntheticEvent)
  }

  const handleExpiryMonthChange = (e) => {
    const value = e.target.value
    // Only allow numbers, max 2 digits
    const filteredValue = value.replace(/[^\d]/g, '').substring(0, 2)

    setExpiryMonth(filteredValue)

    // Update combined expiry date
    const combinedExpiry = `${filteredValue}/${expiryYear}`
    const syntheticEvent = {
      target: {
        name: 'expiryDate',
        value: combinedExpiry
      }
    }

    handleFieldChange(syntheticEvent)
  }

  const handleExpiryYearChange = (e) => {
    const value = e.target.value
    // Only allow numbers, max 4 digits
    const filteredValue = value.replace(/[^\d]/g, '').substring(0, 4)

    setExpiryYear(filteredValue)

    // Update combined expiry date
    const combinedExpiry = `${expiryMonth}/${filteredValue}`
    const syntheticEvent = {
      target: {
        name: 'expiryDate',
        value: combinedExpiry
      }
    }

    handleFieldChange(syntheticEvent)
  }

  const handleCVVChange = (e) => {
    const value = e.target.value
    // Only allow numbers, max length based on card type
    const maxLength = cardType === 'amex' ? 4 : 3
    const filteredValue = value.replace(/[^\d]/g, '').substring(0, maxLength)

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'cvv',
        value: filteredValue
      }
    }

    handleFieldChange(syntheticEvent)
  }

  // Generate year options for dropdown
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear + i)

  // Validate all fields on mount
  useEffect(() => {
    const newValidity = {}
    Object.keys(cardDetails).forEach(fieldName => {
      if (fieldName !== 'expiryMonth' && fieldName !== 'expiryYear') {
        const isValid = validateField(fieldName, cardDetails[fieldName])
        newValidity[fieldName] = isValid

        // Notify parent component of initial validation state
        if (onValidationChange) {
          onValidationChange(fieldName, isValid, '')
        }
      }
    })
    // Special handling for expiry date
    const expiryValid = validateExpiryDate(expiryMonth, expiryYear)
    newValidity.expiryDate = expiryValid

    // Notify parent component of expiry date validation state
    if (onValidationChange) {
      onValidationChange('expiryDate', expiryValid, '')
    }

    setFieldValidity(newValidity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array since we only want to run on mount

  const getFieldStatus = (fieldName) => {
    if (!touchedFields[fieldName]) return 'neutral'
    return fieldValidity[fieldName] ? 'valid' : 'invalid'
  }

  const getFieldClasses = (fieldName, baseClasses = '') => {
    const status = getFieldStatus(fieldName)
    const statusClasses = {
      valid: 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500',
      invalid: 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500',
      neutral: 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
    }

    return `${baseClasses} ${statusClasses[status]}`
  }

  const getCardTypeIcon = (type) => {
    switch (type) {
      case 'visa':
        return '💳' // Could be replaced with actual Visa icon
      case 'mastercard':
        return '💳' // Could be replaced with actual Mastercard icon
      case 'amex':
        return '💳' // Could be replaced with actual Amex icon
      case 'discover':
        return '💳' // Could be replaced with actual Discover icon
      default:
        return '💳'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Payment Details</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${Object.values(fieldValidity).every(v => v) && Object.keys(touchedFields).length > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
          <span className="text-sm text-slate-600">
            {Object.values(fieldValidity).filter(v => v).length}/{Object.keys(cardDetails).filter(k => k !== 'expiryMonth' && k !== 'expiryYear').length} fields valid
          </span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Cardholder Name
          {getFieldStatus('cardholderName') === 'valid' && (
            <span className="ml-2 text-green-600">✓</span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            name="cardholderName"
            value={cardDetails.cardholderName}
            onChange={handleCardholderNameChange}
            onBlur={handleFieldBlur}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('cardholderName')}`}
            placeholder="John Doe"
            required
          />
          {getFieldStatus('cardholderName') === 'valid' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {touchedFields.cardholderName && !fieldValidity.cardholderName && (
          <div className="mt-2 flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{fieldErrors.cardholderName || 'Cardholder name must be at least 2 characters and contain only letters'}</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Number
          {getFieldStatus('cardNumber') === 'valid' && (
            <span className="ml-2 text-green-600">✓</span>
          )}
          {cardType && (
            <span className="ml-2 text-sm text-slate-500 capitalize">{cardType}</span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            name="cardNumber"
            value={cardDetails.cardNumber}
            onChange={handleCardNumberChange}
            onBlur={handleFieldBlur}
            className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('cardNumber')}`}
            placeholder="1234 5678 9012 3456"
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {cardType && (
              <span className="text-lg">{getCardTypeIcon(cardType)}</span>
            )}
            {getFieldStatus('cardNumber') === 'valid' && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        {touchedFields.cardNumber && !fieldValidity.cardNumber && (
          <div className="mt-2 flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{fieldErrors.cardNumber || 'Please enter a valid card number'}</p>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-500">We accept Visa, Mastercard, American Express, and Discover</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Expiry Month
            {getFieldStatus('expiryDate') === 'valid' && expiryMonth && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <select
              value={expiryMonth}
              onChange={handleExpiryMonthChange}
              onBlur={() => handleFieldBlur({ target: { name: 'expiryDate', value: `${expiryMonth}/${expiryYear}` } })}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${getFieldClasses('expiryDate')}`}
              required
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0')
                const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'short' })
                return (
                  <option key={month} value={month}>
                    {month} - {monthName}
                  </option>
                )
              })}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {getFieldStatus('expiryDate') === 'valid' && expiryMonth ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Expiry Year
            {getFieldStatus('expiryDate') === 'valid' && expiryYear && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <select
              value={expiryYear}
              onChange={handleExpiryYearChange}
              onBlur={() => handleFieldBlur({ target: { name: 'expiryDate', value: `${expiryMonth}/${expiryYear}` } })}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${getFieldClasses('expiryDate')}`}
              required
            >
              <option value="">Year</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {getFieldStatus('expiryDate') === 'valid' && expiryYear ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {touchedFields.expiryDate && !fieldValidity.expiryDate && (expiryMonth || expiryYear) && (
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600">{fieldErrors.expiryDate || 'Please select a valid expiry date (not in the past)'}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          CVV
          {getFieldStatus('cvv') === 'valid' && (
            <span className="ml-2 text-green-600">✓</span>
          )}
          <span className="ml-2 text-xs text-slate-500">
            ({cardType === 'amex' ? '4 digits' : '3 digits'})
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="cvv"
            value={cardDetails.cvv}
            onChange={handleCVVChange}
            onBlur={handleFieldBlur}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('cvv')}`}
            placeholder={cardType === 'amex' ? '1234' : '123'}
            maxLength={cardType === 'amex' ? '4' : '3'}
            required
          />
          {getFieldStatus('cvv') === 'valid' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {touchedFields.cvv && !fieldValidity.cvv && cardDetails.cvv && (
          <div className="mt-2 flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{fieldErrors.cvv || `CVV must be ${cardType === 'amex' ? '4' : '3'} digits`}</p>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-500">Security code on the back of your card</p>
      </div>
    </div>
  )
}

export default CardPaymentForm