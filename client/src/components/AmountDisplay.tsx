import React from 'react';
import { useFormatAmount } from '@/hooks/useFormatAmount';

interface AmountDisplayProps {
  amount: number;
  sourceCurrency?: 'EUR' | 'XOF' | 'CFA';
  showEquivalent?: boolean;
  decimals?: number;
  className?: string;
  label?: string;
}

/**
 * Composant pour afficher un montant formaté dans la devise sélectionnée
 */
export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  sourceCurrency = 'EUR',
  showEquivalent = false,
  decimals = 2,
  className = '',
  label,
}) => {
  const { formatAmountWithConversion } = useFormatAmount();

  const formatted = formatAmountWithConversion(amount, sourceCurrency, {
    showEquivalent,
    decimals,
  });

  return (
    <span className={className}>
      {label && <span className="mr-2">{label}</span>}
      <span className="font-semibold">{formatted}</span>
    </span>
  );
};

interface AmountWithEquivalentProps {
  amount: number;
  sourceCurrency?: 'EUR' | 'XOF' | 'CFA';
  decimals?: number;
  className?: string;
  label?: string;
}

/**
 * Composant pour afficher un montant avec son équivalent dans l'autre devise
 */
export const AmountWithEquivalent: React.FC<AmountWithEquivalentProps> = ({
  amount,
  sourceCurrency = 'EUR',
  decimals = 2,
  className = '',
  label,
}) => {
  const { formatAmountWithConversion } = useFormatAmount();

  const formatted = formatAmountWithConversion(amount, sourceCurrency, {
    showEquivalent: true,
    decimals,
  });

  return (
    <div className={className}>
      {label && <p className="text-sm text-muted-foreground mb-1">{label}</p>}
      <p className="font-semibold">{formatted}</p>
    </div>
  );
};

interface AmountTableCellProps {
  amount: number;
  sourceCurrency?: 'EUR' | 'XOF' | 'CFA';
  showEquivalent?: boolean;
  decimals?: number;
}

/**
 * Composant pour afficher un montant dans une cellule de tableau
 */
export const AmountTableCell: React.FC<AmountTableCellProps> = ({
  amount,
  sourceCurrency = 'EUR',
  showEquivalent = false,
  decimals = 2,
}) => {
  const { formatAmountWithConversion } = useFormatAmount();

  const formatted = formatAmountWithConversion(amount, sourceCurrency, {
    showEquivalent,
    decimals,
  });

  return <span className="whitespace-nowrap">{formatted}</span>;
};
