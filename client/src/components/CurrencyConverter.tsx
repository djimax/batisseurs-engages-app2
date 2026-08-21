import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

export const CurrencyConverter: React.FC = () => {
  const { convertCurrency, exchangeRate, formatAmount } = useCurrency();
  const [eurAmount, setEurAmount] = useState('100');
  const [xofAmount, setXofAmount] = useState('');

  useEffect(() => {
    if (eurAmount) {
      const converted = convertCurrency(parseFloat(eurAmount), 'EUR', 'XOF');
      setXofAmount(converted.toFixed(2));
    } else {
      setXofAmount('');
    }
  }, [eurAmount, exchangeRate, convertCurrency]);

  const handleSwap = () => {
    if (xofAmount) {
      setEurAmount(parseFloat(xofAmount).toFixed(2));
    }
  };

  const handleCopyEur = () => {
    navigator.clipboard.writeText(eurAmount);
    toast.success('EUR copié dans le presse-papiers');
  };

  const handleCopyXof = () => {
    navigator.clipboard.writeText(xofAmount);
    toast.success('XOF copié dans le presse-papiers');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Convertisseur de Devises</CardTitle>
        <CardDescription>
          Convertissez automatiquement entre EUR et XOF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exchange Rate Info */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Taux de change: <strong>1 EUR = {exchangeRate.toFixed(3)} XOF</strong>
          </p>
        </div>

        {/* EUR Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Montant en EUR</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={eurAmount}
              onChange={(e) => setEurAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
            <Button
              onClick={handleCopyEur}
              variant="outline"
              size="sm"
              className="px-3"
            >
              €
            </Button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwap}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Inverser
          </Button>
        </div>

        {/* XOF Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Montant en XOF</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={xofAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 px-3 py-2 border border-input rounded-md bg-muted text-foreground"
            />
            <Button
              onClick={handleCopyXof}
              variant="outline"
              size="sm"
              className="px-3"
            >
              F
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-900 dark:text-green-100">
            <strong>{eurAmount || '0'} EUR</strong> = <strong>{xofAmount || '0'} XOF</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
