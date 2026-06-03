export const formatCurrency = (value, currency = 'INR', locale = 'en-IN') => {
  if (value === undefined || value === null || isNaN(value)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default formatCurrency;