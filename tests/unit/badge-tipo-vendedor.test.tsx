import React from 'react';
import { render, screen } from '@testing-library/react';
import BadgeTipoVendedor, { esTipoVendedor } from '@/components/BadgeTipoVendedor';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const traducciones: Record<string, string> = {
      'tiposVendedor.particular': 'Particular',
      'tiposVendedor.taller': 'Taller',
      'tiposVendedor.profesional': 'Pro',
    };
    return traducciones[key] ?? key;
  },
}));

describe('BadgeTipoVendedor', () => {
  it.each([
    ['particular', '👤', 'Particular'],
    ['taller', '🔧', 'Taller'],
    ['profesional', '🏢', 'Pro'],
  ] as const)('renderiza el chip %s con su emoji y etiqueta', (tipo, emoji, etiqueta) => {
    const { container } = render(<BadgeTipoVendedor tipo={tipo} />);
    expect(screen.getByText(etiqueta)).toBeInTheDocument();
    expect(container.textContent).toContain(emoji);
  });

  it('no renderiza nada con tipo inválido, nulo o vacío', () => {
    for (const tipo of [undefined, null, '', 'empresa', 'PARTICULAR']) {
      const { container } = render(<BadgeTipoVendedor tipo={tipo} />);
      expect(container.firstChild).toBeNull();
    }
  });
});

describe('esTipoVendedor', () => {
  it('acepta solo los tres tipos válidos', () => {
    expect(esTipoVendedor('particular')).toBe(true);
    expect(esTipoVendedor('taller')).toBe(true);
    expect(esTipoVendedor('profesional')).toBe(true);
    expect(esTipoVendedor('otro')).toBe(false);
    expect(esTipoVendedor(null)).toBe(false);
  });
});
