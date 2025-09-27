import React, { useState, useEffect } from 'react'

const AddressForm = ({ address, fieldErrors, onChange, onValidationChange }) => {
  const [touchedFields, setTouchedFields] = useState({})
  const [fieldValidity, setFieldValidity] = useState({})

  // Sri Lankan phone number validation
  const validatePhoneNumber = (phone) => {
    const sriLankanPhoneRegex = /^(\+94|0)[1-9]\d{8}$/
    return sriLankanPhoneRegex.test(phone.replace(/\s/g, ''))
  }

  // Sri Lankan NIC validation
  const validateNIC = (nic) => {
    if (!nic) return true // Optional field
    const oldNICRegex = /^\d{9}[VX]$/i
    const newNICRegex = /^\d{12}$/
    return oldNICRegex.test(nic) || newNICRegex.test(nic)
  }

  // Postal code validation
  const validatePostalCode = (postalCode) => {
    return /^\d{5}$/.test(postalCode)
  }

  // Name validation
  const validateName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim())
  }

  // Address validation
  const validateAddress = (address) => {
    return address.trim().length >= 5
  }

  // City validation
  const validateCity = (city) => {
    return city.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(city.trim())
  }

  const validateField = (name, value) => {
    let isValid = false

    switch (name) {
      case 'fullName':
        isValid = validateName(value)
        break
      case 'phoneNumber':
        isValid = validatePhoneNumber(value)
        break
      case 'street':
        isValid = validateAddress(value)
        break
      case 'city':
        isValid = validateCity(value)
        break
      case 'district':
        isValid = value !== ''
        break
      case 'province':
        isValid = value !== ''
        break
      case 'postalCode':
        isValid = validatePostalCode(value)
        break
      case 'nic':
        isValid = validateNIC(value)
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

    // Validate field
    const isValid = validateField(name, value)
    setFieldValidity(prev => ({ ...prev, [name]: isValid }))

    // Update parent component with validation result
    if (onValidationChange) {
      onValidationChange(name, isValid, '')
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

  // Validate all fields on mount
  useEffect(() => {
    const newValidity = {}
    Object.keys(address).forEach(fieldName => {
      const isValid = validateField(fieldName, address[fieldName])
      newValidity[fieldName] = isValid

      // Notify parent component of initial validation state
      if (onValidationChange) {
        onValidationChange(fieldName, isValid, '')
      }
    })
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
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Delivery Address</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${Object.values(fieldValidity).every(v => v) && Object.keys(touchedFields).length > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
          <span className="text-sm text-slate-600">
            {Object.values(fieldValidity).filter(v => v).length}/{Object.keys(address).length} fields valid
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
            {getFieldStatus('fullName') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              name="fullName"
              value={address.fullName}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('fullName')}`}
              placeholder="Enter your full name"
              required
            />
            {getFieldStatus('fullName') === 'valid' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {touchedFields.fullName && !fieldValidity.fullName && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.fullName || 'Full name must be at least 2 characters and contain only letters'}</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number
            {getFieldStatus('phoneNumber') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <input
              type="tel"
              name="phoneNumber"
              value={address.phoneNumber}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('phoneNumber')}`}
              placeholder="+94712345678 or 0712345678"
              required
            />
            {getFieldStatus('phoneNumber') === 'valid' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {touchedFields.phoneNumber && !fieldValidity.phoneNumber && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.phoneNumber || 'Please enter a valid Sri Lankan phone number (+94XXXXXXXXX or 0XXXXXXXXX)'}</p>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Example: +94712345678 or 0712345678</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Street Address
            {getFieldStatus('street') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              name="street"
              value={address.street}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('street')}`}
              placeholder="No. 123, Main Street, Your Area"
              required
            />
            {getFieldStatus('street') === 'valid' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {touchedFields.street && !fieldValidity.street && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.street || 'Street address must be at least 5 characters'}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            City
            {getFieldStatus('city') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              name="city"
              value={address.city}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('city')}`}
              placeholder="Colombo"
              required
            />
            {getFieldStatus('city') === 'valid' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {touchedFields.city && !fieldValidity.city && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.city || 'City name must be at least 2 characters and contain only letters'}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            District
            {getFieldStatus('district') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <select
              name="district"
              value={address.district}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${getFieldClasses('district')}`}
              required
            >
              <option value="">Select District</option>
              <option value="Colombo">Colombo</option>
              <option value="Gampaha">Gampaha</option>
              <option value="Kalutara">Kalutara</option>
              <option value="Kandy">Kandy</option>
              <option value="Matale">Matale</option>
              <option value="Nuwara Eliya">Nuwara Eliya</option>
              <option value="Galle">Galle</option>
              <option value="Matara">Matara</option>
              <option value="Hambantota">Hambantota</option>
              <option value="Jaffna">Jaffna</option>
              <option value="Kilinochchi">Kilinochchi</option>
              <option value="Mannar">Mannar</option>
              <option value="Vavuniya">Vavuniya</option>
              <option value="Mullaitivu">Mullaitivu</option>
              <option value="Batticaloa">Batticaloa</option>
              <option value="Ampara">Ampara</option>
              <option value="Trincomalee">Trincomalee</option>
              <option value="Kurunegala">Kurunegala</option>
              <option value="Puttalam">Puttalam</option>
              <option value="Anuradhapura">Anuradhapura</option>
              <option value="Polonnaruwa">Polonnaruwa</option>
              <option value="Badulla">Badulla</option>
              <option value="Moneragala">Moneragala</option>
              <option value="Ratnapura">Ratnapura</option>
              <option value="Kegalle">Kegalle</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {getFieldStatus('district') === 'valid' ? (
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
          {touchedFields.district && !fieldValidity.district && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.district || 'Please select a district'}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Province
            {getFieldStatus('province') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <select
              name="province"
              value={address.province}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${getFieldClasses('province')}`}
              required
            >
              <option value="">Select Province</option>
              <option value="Western">Western Province</option>
              <option value="Central">Central Province</option>
              <option value="Southern">Southern Province</option>
              <option value="Northern">Northern Province</option>
              <option value="Eastern">Eastern Province</option>
              <option value="North Western">North Western Province</option>
              <option value="North Central">North Central Province</option>
              <option value="Uva">Uva Province</option>
              <option value="Sabaragamuwa">Sabaragamuwa Province</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {getFieldStatus('province') === 'valid' ? (
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
          {touchedFields.province && !fieldValidity.province && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.province || 'Please select a province'}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Postal Code
            {getFieldStatus('postalCode') === 'valid' && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              name="postalCode"
              value={address.postalCode}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('postalCode')}`}
              placeholder="00000"
              maxLength="5"
              required
            />
            {getFieldStatus('postalCode') === 'valid' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {touchedFields.postalCode && !fieldValidity.postalCode && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.postalCode || 'Postal code must be exactly 5 digits'}</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            NIC Number (Optional)
            {getFieldStatus('nic') === 'valid' && address.nic && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              name="nic"
              value={address.nic}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${getFieldClasses('nic')}`}
              placeholder="123456789V or 200012345678"
            />
            {getFieldStatus('nic') === 'valid' && address.nic && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {touchedFields.nic && !fieldValidity.nic && address.nic && (
            <div className="mt-2 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{fieldErrors.nic || 'Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits)'}</p>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Examples: 123456789V (old format) or 200012345678 (new format)</p>
        </div>
      </div>
    </div>
  )
}

export default AddressForm