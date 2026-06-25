'use client';

import PhoneInput, { type Country } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { cn } from '@/lib/cn';
import 'react-phone-number-input/style.css';

type PhoneInputFieldProps = {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  defaultCountry?: Country;
  id?: string;
};

export function PhoneInputField({
  label,
  value = '',
  onChange,
  error,
  placeholder = 'Enter phone number',
  required,
  defaultCountry = 'MK',
  id,
}: PhoneInputFieldProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <PhoneInput
        id={id}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        labels={en}
        value={value || undefined}
        onChange={(next) => onChange(next || '')}
        placeholder={placeholder}
        className={cn('phone-input-field', error && 'phone-input-field--error')}
        numberInputProps={{ required }}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function isValidContactPhone(value?: string | null) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  return isValidPhoneNumber(trimmed);
}
