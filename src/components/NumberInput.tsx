import React, { useState, useCallback } from 'react';
import { TextField, InputAdornment } from '@mui/material';

type NumberInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  helperText?: string;
  sx?: object;
};

function formatNumber(n: number): string {
  if (n === 0) return '';
  return n.toLocaleString('zh-TW');
}

function parseNumber(str: string): number {
  const cleaned = str.replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  helperText,
  sx,
}) => {
  const [displayValue, setDisplayValue] = useState(formatNumber(value));
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw number on focus for easier editing
    setDisplayValue(value === 0 ? '' : String(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseNumber(displayValue);
    onChange(parsed);
    setDisplayValue(formatNumber(parsed));
  }, [displayValue, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only digits, minus sign, and decimal point
    if (/^-?\d*\.?\d*$/.test(raw.replace(/,/g, ''))) {
      setDisplayValue(raw);
      if (!isFocused) {
        onChange(parseNumber(raw));
      }
    }
  }, [isFocused, onChange]);

  // Sync external value changes when not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value));
    }
  }, [value, isFocused]);

  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      helperText={helperText}
      fullWidth
      size="small"
      inputProps={{
        inputMode: 'numeric',
        style: { textAlign: 'right' },
      }}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      }}
      sx={sx}
    />
  );
};

export default NumberInput;
