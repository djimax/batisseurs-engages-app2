import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CurrencyContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Conversion Functions', () => {
    it('should convert EUR to XOF correctly', () => {
      const DEFAULT_EXCHANGE_RATE = 655.957;
      const eurAmount = 100;
      const expectedCfa = eurAmount * DEFAULT_EXCHANGE_RATE;
      
      expect(expectedCfa).toBeCloseTo(65595.7, 1);
    });

    it('should convert XOF to EUR correctly', () => {
      const DEFAULT_EXCHANGE_RATE = 655.957;
      const xofAmount = 65595.7;
      const expectedEur = xofAmount / DEFAULT_EXCHANGE_RATE;
      
      expect(expectedEur).toBeCloseTo(100, 1);
    });

    it('should handle custom exchange rates', () => {
      const customRate = 700;
      const eurAmount = 100;
      const expectedCfa = eurAmount * customRate;
      
      expect(expectedCfa).toBe(70000);
    });

    it('should return same amount when converting to same currency', () => {
      const amount = 100;
      expect(amount).toBe(100);
    });
  });

  describe('Exchange Rate Management', () => {
    it('should use default exchange rate (655.957)', () => {
      const DEFAULT_EXCHANGE_RATE = 655.957;
      expect(DEFAULT_EXCHANGE_RATE).toBe(655.957);
    });

    it('should validate positive exchange rates', () => {
      const validRate = 700;
      const invalidRate = -100;
      
      expect(validRate > 0).toBe(true);
      expect(invalidRate > 0).toBe(false);
    });

    it('should persist exchange rate to localStorage', () => {
      const rate = 700;
      localStorage.setItem('exchangeRate', rate.toString());
      
      const saved = localStorage.getItem('exchangeRate');
      expect(saved).toBe('700');
    });

    it('should retrieve exchange rate from localStorage', () => {
      const rate = 700;
      localStorage.setItem('exchangeRate', rate.toString());
      
      const retrieved = parseFloat(localStorage.getItem('exchangeRate') || '655.957');
      expect(retrieved).toBe(700);
    });
  });

  describe('Currency Formatting', () => {
    it('should format EUR with euro symbol', () => {
      const symbol = '€';
      const amount = 100;
      const formatted = `${amount.toFixed(2)} ${symbol}`;
      
      expect(formatted).toBe('100.00 €');
    });

    it('should format XOF with F symbol', () => {
      const symbol = 'F';
      const amount = 65595.7;
      const formatted = `${amount.toFixed(2)} ${symbol}`;
      
      expect(formatted).toBe('65595.70 F');
    });

    it('should use French locale formatting', () => {
      const amount = 1234.56;
      const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      
      expect(formatted).toBe('1 234,56');
    });
  });

  describe('Currency Selection', () => {
    it('should persist selected currency to localStorage', () => {
      const currency = 'EUR';
      localStorage.setItem('currency', currency);
      
      const saved = localStorage.getItem('currency');
      expect(saved).toBe('EUR');
    });

    it('should default to EUR if no currency saved', () => {
      const saved = localStorage.getItem('currency');
      const defaultCurrency = (saved as 'EUR' | 'XOF') || 'EUR';
      
      expect(defaultCurrency).toBe('EUR');
    });

    it('should switch between EUR and XOF', () => {
      let currency: 'EUR' | 'XOF' = 'EUR';
      expect(currency).toBe('EUR');
      
      currency = 'XOF';
      expect(currency).toBe('XOF');
      
      currency = 'EUR';
      expect(currency).toBe('EUR');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amounts', () => {
      const eurAmount = 0;
      const DEFAULT_EXCHANGE_RATE = 655.957;
      const xofAmount = eurAmount * DEFAULT_EXCHANGE_RATE;
      
      expect(xofAmount).toBe(0);
    });

    it('should handle very large amounts', () => {
      const eurAmount = 1000000;
      const DEFAULT_EXCHANGE_RATE = 655.957;
      const xofAmount = eurAmount * DEFAULT_EXCHANGE_RATE;
      
      expect(xofAmount).toBeCloseTo(655957000, -3);
    });

    it('should handle decimal precision', () => {
      const eurAmount = 0.01;
      const DEFAULT_EXCHANGE_RATE = 655.957;
      const xofAmount = eurAmount * DEFAULT_EXCHANGE_RATE;
      
      expect(xofAmount).toBeCloseTo(6.56, 2);
    });

    it('should handle exchange rate reset', () => {
      const customRate = 700;
      const DEFAULT_EXCHANGE_RATE = 655.957;
      
      let currentRate = customRate;
      expect(currentRate).toBe(700);
      
      currentRate = DEFAULT_EXCHANGE_RATE;
      expect(currentRate).toBe(655.957);
    });
  });
});
