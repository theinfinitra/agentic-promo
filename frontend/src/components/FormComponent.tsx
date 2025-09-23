import React, { useState } from 'react';
import { StructuredData, FormField } from '../types';

interface FormComponentProps {
  data: StructuredData;
  onSubmit?: (formData: Record<string, any>) => void;
}

export const FormComponent: React.FC<FormComponentProps> = ({ data, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (data.type !== 'form' || !data.fields) {
    return <div className="text-red-500">Invalid form data</div>;
  }

  const handleInputChange = (field: FormField, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field.name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field.name]) {
      setErrors(prev => ({
        ...prev,
        [field.name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    data.fields!.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
      
      if (field.type === 'number' && formData[field.name]) {
        const num = Number(formData[field.name]);
        if (isNaN(num)) {
          newErrors[field.name] = 'Please enter a valid number';
        } else {
          if (field.min !== undefined && num < field.min) {
            newErrors[field.name] = `Value must be at least ${field.min}`;
          }
          if (field.max !== undefined && num > field.max) {
            newErrors[field.name] = `Value must be at most ${field.max}`;
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || field.default || '';
    const hasError = !!errors[field.name];
    
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`form-field ${hasError ? 'border-red-500' : ''}`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={`form-field ${hasError ? 'border-red-500' : ''}`}
            rows={3}
          />
        );
      
      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={`form-field ${hasError ? 'border-red-500' : ''}`}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {data.title && (
        <h2 className="text-xl font-bold mb-4 text-gray-900">{data.title}</h2>
      )}
      
      <form onSubmit={handleSubmit} className="form-component">
        {data.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold mb-2" style={{color: 'var(--text-primary)'}}>
              {field.label}
              {field.required && <span className="text-urgency ml-1">*</span>}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors[field.name]}</p>
            )}
          </div>
        ))}
        
        <div className="flex space-x-4 pt-6">
          <button type="submit" className="btn-primary">
            {data.config?.actions?.[0]?.label || 'Submit'}
          </button>
          <button type="button" className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
