import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'EUR' | 'XOF' | 'CFA';
export type CanonicalCurrency = 'EUR' | 'XOF';

// Taux de change fixe de référence : 1 EUR = 655,957 XOF.
const DEFAULT_EXCHANGE_RATE = 655.957;

const normalizeCurrency = (value: Currency): CanonicalCurrency => value === 'EUR' ? 'EUR' : 'XOF';

interface CurrencyContextType {
  currency: CanonicalCurrency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  formatAmount: (amount: number) => string;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  resetExchangeRate: () => void;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CanonicalCurrency>(() => {
    const saved = localStorage.getItem('currency');
    return saved === 'XOF' || saved === 'CFA' ? 'XOF' : 'EUR';
  });

  const [exchangeRate, setExchangeRateState] = useState<number>(() => {
    const saved = localStorage.getItem('exchangeRate');
    return saved ? parseFloat(saved) : DEFAULT_EXCHANGE_RATE;
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('exchangeRate', exchangeRate.toString());
  }, [exchangeRate]);

  const symbol = currency === 'EUR' ? '€' : 'F CFA';

  const formatAmount = (amount: number): string => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: currency === 'EUR' ? 2 : 0,
      maximumFractionDigits: currency === 'EUR' ? 2 : 0,
    }).format(amount);
    return `${formatted} ${symbol}`;
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(normalizeCurrency(newCurrency));
  };

  const setExchangeRate = (rate: number) => {
    if (rate > 0 && Number.isFinite(rate)) {
      setExchangeRateState(rate);
    }
  };

  const resetExchangeRate = () => {
    setExchangeRateState(DEFAULT_EXCHANGE_RATE);
  };

  const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
    const normalizedFrom = normalizeCurrency(from);
    const normalizedTo = normalizeCurrency(to);
    if (normalizedFrom === normalizedTo) return amount;
    return normalizedFrom === 'EUR' ? amount * exchangeRate : amount / exchangeRate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        symbol,
        formatAmount,
        exchangeRate,
        setExchangeRate,
        resetExchangeRate,
        convertCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
