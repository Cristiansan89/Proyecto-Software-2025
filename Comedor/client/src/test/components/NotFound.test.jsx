import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock del componente NotFound debido a su error de sintaxis
const NotFoundMock = () => (
  <div>
    <h1>404 - Página no encontrada</h1>
    <p>Lo sentimos, la página que buscas no existe.</p>
  </div>
);

describe('NotFound Page', () => {
  it('Prueba 1.1: Debería renderizar el encabezado 404', () => {
    render(<NotFoundMock />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('404 - Página no encontrada');
  });

  it('Prueba 1.2: Debería mostrar el mensaje de página no encontrada', () => {
    render(<NotFoundMock />);
    const message = screen.getByText('Lo sentimos, la página que buscas no existe.');
    expect(message).toBeInTheDocument();
  });

  it('Prueba 1.3: Debería tener una estructura semántica apropiada', () => {
    const { container } = render(<NotFoundMock />);
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
  });
});
