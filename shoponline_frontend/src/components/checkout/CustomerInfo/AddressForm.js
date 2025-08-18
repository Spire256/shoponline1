// src/components/checkout/CustomerInfo/AddressForm.js
import React, { useState } from 'react';

const AddressForm = ({ initialData, onSubmit, loading }) => {
  // Uganda districts for dropdown
  const ugandaDistricts = [
    'Abim',
    'Adjumani',
    'Agago',
    'Alebtong',
    'Amolatar',
    'Amudat',
    'Amuria',
    'Amuru',
    'Apac',
    'Arua',
    'Budaka',
    'Bududa',
    'Bugiri',
    'Buhweju',
    'Buikwe',
    'Bukedea',
    'Bukomansimbi',
    'Bukwo',
    'Bulambuli',
    'Buliisa',
    'Bundibugyo',
    'Bushenyi',
    'Busia',
    'Butaleja',
    'Butambala',
    'Buvuma',
    'Buyende',
    'Dokolo',
    'Gomba',
    'Gulu',
    'Hoima',
    'Ibanda',
    'Iganga',
    'Isingiro',
    'Jinja',
    'Kaabong',
    'Kabale',
    'Kabarole',
    'Kaberamaido',
    'Kalangala',
    'Kaliro',
    'Kampala',
    'Kamuli',
    'Kamwenge',
    'Kanungu',
    'Kapchorwa',
    'Kasese',
    'Katakwi',
    'Kayunga',
    'Kibaale',
    'Kiboga',
    'Kibuku',
    'Kiruhura',
    'Kiryandongo',
    'Kisoro',
    'Kitgum',
    'Koboko',
    'Kole',
    'Kotido',
    'Kumi',
    'Kween',
    'Kyankwanzi',
    'Kyegegwa',
    'Kyenjojo',
    'Lamwo',
    'Lira',
    'Luuka',
    'Luwero',
    'Lwengo',
    'Lyantonde',
    'Manafwa',
    'Maracha',
    'Masaka',
    'Masindi',
    'Mayuge',
    'Mbale',
    'Mbarara',
    'Mitooma',
    'Mityana',
    'Moroto',
    'Moyo',
    'Mpigi',
    'Mubende',
    'Mukono',
    'Nakapiripirit',
    'Nakaseke',
    'Nakasongola',
    'Namayingo',
    'Namutumba',
    'Napak',
    'Nebbi',
    'Ngora',
    'Ntoroko',
    'Ntungamo',
    'Nwoya',
    'Otuke',
    'Oyam',
    'Pader',
    'Pallisa',
    'Rakai',
    'Rubanda',
    'Rubirizi',
    'Rukiga',
    'Rukungiri',
    'Sembabule',
    'Serere',
    'Sheema',
    'Sironko',
    'Soroti',
    'Tororo',
    'Wakiso',
    'Yumbe',
    'Zombo',
  ];

  const [formData, setFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    district: '',
    postal_code: '',
    delivery_notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case 'address_line_1':
        if (!value.trim()) {
          return 'Street address is required';
        }
        if (value.trim().length < 5) {
          return 'Please provide a more detailed address';
        }
        return '';

      case 'city':
        if (!value.trim()) {
          return 'City is required';
        }
        if (value.trim().length < 2) {
          return 'Please enter a valid city name';
        }
        return '';

      case 'district':
        if (!value.trim()) {
          return 'District is required';
        }
        if (!ugandaDistricts.includes(value)) {
          return 'Please select a valid Uganda district';
        }
        return '';

      case 'postal_code':
        // Postal code is optional but validate format if provided
        if (value && !/^\d{5}$/.test(value)) {
          return 'Postal code should be 5 digits';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['address_line_1', 'city', 'district'];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate optional fields if they have values
    if (formData.postal_code) {
      const postalError = validateField('postal_code', formData.postal_code);
      if (postalError) {
        newErrors.postal_code = postalError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Validate field on change if it was previously touched or form was submitted
    if (touched[name] || isSubmitted) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }

    // Auto-submit when form is valid and user is making changes
    if (isSubmitted && validateForm()) {
      onSubmit({
        ...formData,
        [name]: value,
        address_line_1: (name === 'address_line_1' ? value : formData.address_line_1).trim(),
        city: (name === 'city' ? value : formData.city).trim(),
        district: (name === 'district' ? value : formData.district).trim(),
        postal_code: (name === 'postal_code' ? value : formData.postal_code).trim(),
        delivery_notes: (name === 'delivery_notes' ? value : formData.delivery_notes).trim(),
      });
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setIsSubmitted(true);

    // Mark all required fields as touched
    const requiredFields = ['address_line_1', 'city', 'district'];
    const allTouched = { ...touched };
    requiredFields.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      onSubmit({
        ...formData,
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        postal_code: formData.postal_code.trim(),
        delivery_notes: formData.delivery_notes.trim(),
      });
    }
  };

  const getFieldClassName = fieldName => {
    let className = 'form-input';
    if (errors[fieldName]) {
      className += ' error';
    } else if (touched[fieldName] && formData[fieldName]) {
      className += ' success';
    }
    return className;
  };

  const getSelectClassName = fieldName => {
    let className = 'form-select';
    if (errors[fieldName]) {
      className += ' error';
    } else if (touched[fieldName] && formData[fieldName]) {
      className += ' success';
    }
    return className;
  };

  return (
    <div className="address-form">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="address_line_1" className="form-label">
            Street Address *
          </label>
          <div className="input-with-icon">
            <i className="fas fa-home input-icon" />
            <input
              type="text"
              id="address_line_1"
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('address_line_1')}
              placeholder="Enter your street address, building name, etc."
              disabled={loading}
              autoComplete="address-line1"
            />
          </div>
          {errors.address_line_1 && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.address_line_1}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="address_line_2" className="form-label">
            Apartment, Suite, etc. (Optional)
          </label>
          <input
            type="text"
            id="address_line_2"
            name="address_line_2"
            value={formData.address_line_2}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClassName('address_line_2')}
            placeholder="Apartment, suite, unit, building, floor, etc."
            disabled={loading}
            autoComplete="address-line2"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="city" className="form-label">
              City *
            </label>
            <div className="input-with-icon">
              <i className="fas fa-building input-icon" />
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('city')}
                placeholder="Enter your city"
                disabled={loading}
                autoComplete="address-level2"
              />
            </div>
            {errors.city && (
              <div className="form-error">
                <i className="fas fa-exclamation-triangle" />
                {errors.city}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="district" className="form-label">
              District *
            </label>
            <div className="input-with-icon">
              <i className="fas fa-map-marker-alt input-icon" />
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getSelectClassName('district')}
                disabled={loading}
                autoComplete="address-level1"
              >
                <option value="">Select District</option>
                {ugandaDistricts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            {errors.district && (
              <div className="form-error">
                <i className="fas fa-exclamation-triangle" />
                {errors.district}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="postal_code" className="form-label">
            Postal Code (Optional)
          </label>
          <div className="input-with-icon">
            <i className="fas fa-mail-bulk input-icon" />
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('postal_code')}
              placeholder="e.g., 00256"
              maxLength="5"
              disabled={loading}
              autoComplete="postal-code"
            />
          </div>
          {errors.postal_code && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.postal_code}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="delivery_notes" className="form-label">
            Delivery Instructions (Optional)
          </label>
          <textarea
            id="delivery_notes"
            name="delivery_notes"
            value={formData.delivery_notes}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClassName('delivery_notes')}
            placeholder="Any special instructions for delivery (e.g., gate code, landmarks, best time to deliver)"
            rows="3"
            maxLength="500"
            disabled={loading}
          />
          <div className="form-hint">
            <i className="fas fa-info-circle" />
            Help our delivery team find you easily with specific instructions
          </div>
        </div>

        {/* Address preview */}
        {formData.address_line_1 && formData.city && formData.district && (
          <div className="address-preview">
            <h4>Delivery Address Preview:</h4>
            <div className="preview-content">
              <i className="fas fa-map-marker-alt" />
              <div className="address-text">
                {formData.address_line_1}
                {formData.address_line_2 && (
                  <>
                    <br />
                    {formData.address_line_2}
                  </>
                )}
                <br />
                {formData.city}, {formData.district}
                {formData.postal_code && <> {formData.postal_code}</>}
                <br />
                <strong>Uganda</strong>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Form validation summary for accessibility */}
      {Object.keys(errors).length > 0 && isSubmitted && (
        <div className="form-summary" role="alert" aria-live="polite">
          <h4>Please correct the following errors:</h4>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
