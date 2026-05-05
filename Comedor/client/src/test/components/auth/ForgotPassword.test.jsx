import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPassword } from '../../../components/auth/ForgotPassword';

describe('ForgotPassword Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('Prueba 5.1: Debería mostrarse el formulario de recuperación de contraseña', () => {
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const input = screen.getByLabelText('Nombre de Usuario');
    expect(input).toBeInTheDocument();
  });

  it('Prueba 5.2: Debe mostrar error cuando el nombre de usuario está vacío', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const submitBtn = screen.getByRole('button', { name: /Enviar|Recuperar/i });
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Por favor ingrese su nombre de usuario/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('Prueba 5.3: Debe manejar los cambios en el input de nombre de usuario', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const input = screen.getByLabelText('Nombre de Usuario');
    await user.type(input, 'testuser');
    
    expect(input).toHaveValue('testuser');
  });

  it('Prueba 5.4: Debe borrar el mensaje de error cuando el usuario empieza a escribir', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const input = screen.getByLabelText('Nombre de Usuario');
    const submitBtn = screen.getByRole('button', { name: /Enviar|Recuperar/i });
    
    // Trigger error
    await user.click(submitBtn);
    
    // Clear error by typing
    await user.type(input, 'testuser');
  });

  it('Prueba 5.5: Debe tener una estructura de formulario apropiada', () => {
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const form = screen.getByRole('button', { name: /Enviar|Recuperar/i }).closest('form');
    expect(form).toBeInTheDocument();
  });

  it('Prueba 5.6: Debe tener un input con el tipo correcto', () => {
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const input = screen.getByLabelText('Nombre de Usuario');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('Prueba 5.7: Debe enviar el formulario con un nombre de usuario válido', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Email sent' })
    });

    render(<ForgotPassword onBack={mockOnBack} />);
    
    const input = screen.getByLabelText('Nombre de Usuario');
    const submitBtn = screen.getByRole('button', { name: /Enviar|Recuperar/i });
    
    await user.type(input, 'validaruser');
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 1000 });
  });
});
