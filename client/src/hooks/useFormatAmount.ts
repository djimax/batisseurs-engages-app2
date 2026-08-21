import { useCurrency, type Currency } from '@/contexts/CurrencyContext';

interface FormatOptions {
  showEquivalent?: boolean;
  decimals?: number;
}

const normalizeCurrency = (currency: Currency): 'EUR' | 'XOF' => currency === 'EUR' ? 'EUR' : 'XOF';
const currencyLabel = (currency: 'EUR' | 'XOF') => currency === 'EUR' ? '€' : 'F CFA';

export const useFormatAmount = () => {
  const { currency, convertCurrency, formatAmount, exchangeRate } = useCurrency();

  const formatAmountWithConversion = (amount: number, sourceCurrency: Currency = 'EUR', options: FormatOptions = {}) => {
    const { showEquivalent = false, decimals = 2 } = options;
    const normalizedSource = normalizeCurrency(sourceCurrency);
    const convertedAmount = normalizedSource !== currency
      ? convertCurrency(amount, normalizedSource, currency)
      : amount;
    const formatted = formatAmount(convertedAmount);

    if (!showEquivalent) return formatted;

    const equivalentCurrency = currency === 'EUR' ? 'XOF' : 'EUR';
    const equivalentAmount = convertCurrency(convertedAmount, currency, equivalentCurrency);
    return `${formatted} (≈ ${equivalentAmount.toFixed(equivalentCurrency === 'XOF' ? 0 : decimals)} ${currencyLabel(equivalentCurrency)})`;
  };

  const formatAmountInCurrency = (amount: number, targetCurrency: Currency, sourceCurrency: Currency = 'EUR', options: FormatOptions = {}) => {
    const { showEquivalent = false, decimals = 2 } = options;
    const normalizedTarget = normalizeCurrency(targetCurrency);
    const normalizedSource = normalizeCurrency(sourceCurrency);
    const convertedAmount = normalizedSource !== normalizedTarget
      ? convertCurrency(amount, normalizedSource, normalizedTarget)
      : amount;
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: normalizedTarget === 'EUR' ? decimals : 0,
      maximumFractionDigits: normalizedTarget === 'EUR' ? decimals : 0,
    }).format(convertedAmount);
    const result = `${formatted} ${currencyLabel(normalizedTarget)}`;

    if (!showEquivalent) return result;

    const equivalentCurrency = normalizedTarget === 'EUR' ? 'XOF' : 'EUR';
    const equivalentAmount = convertCurrency(convertedAmount, normalizedTarget, equivalentCurrency);
    return `${result} (≈ ${equivalentAmount.toFixed(equivalentCurrency === 'XOF' ? 0 : decimals)} ${currencyLabel(equivalentCurrency)})`;
  };

  const getExchangeRateInfo = () => ({
    rate: exchangeRate,
    display: `1 EUR = ${exchangeRate.toFixed(3)} XOF`,
    inverse: `1 XOF = ${(1 / exchangeRate).toFixed(6)} EUR`,
  });

  return {
    formatAmountWithConversion,
    formatAmountInCurrency,
    getExchangeRateInfo,
    currentCurrency: currency,
    exchangeRate,
  };
};
