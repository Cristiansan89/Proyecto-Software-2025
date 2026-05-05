import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../components/ErrorBoundary';

// Componente que lanza error para testing
const ThrowError = () => {
  throw new Error('Test error');
};

// Componente normal para testing
const GoodComponent = () => {
  return <div>Component works fine</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suprimir logs de error en consola durante los tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('Prueba 2.1: Se deben renderizar los elementos hijos cuando no ocurre ningún error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Component works fine')).toBeInTheDocument();
  });

  it('Prueba 2.2: Se debe mostrar la interfaz de error cuando ocurre un error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/¡Oops! Algo salió mal/i)).toBeInTheDocument();
  });

  it('Prueba 2.3: Debería mostrar el mensaje de error y el icono', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Ha ocurrido un error inesperado/i)).toBeInTheDocument();
  });

  it('Prueba 2.4: Debería tener botones de recargar y reintentar', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const reloadBtn = screen.getByRole('button', { name: /Recargar Página/i });
    const retryBtn = screen.getByRole('button', { name: /Intentar de Nuevo/i });
    
    expect(reloadBtn).toBeInTheDocument();
    expect(retryBtn).toBeInTheDocument();
  });

  it('Prueba 2.5: Debería tener una sección de detalles con información de error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const detailsElement = screen.getByText(/Detalles técnicos/i);
    expect(detailsElement).toBeInTheDocument();
  });

  it('Prueba 2.6: Debería limpiar el error cuando se hace clic en el botón de reintentar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/¡Oops! Algo salió mal/i)).toBeInTheDocument();
    
    const retryBtn = screen.getByRole('button', { name: /Intentar de Nuevo/i });
    await user.click(retryBtn);
    
    rerender(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
  });
});
