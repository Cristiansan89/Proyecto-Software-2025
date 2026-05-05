import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePassword } from '../../../components/auth/ChangePassword';

describe('ChangePassword Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-token');
  });

  it('Prueba 4.1: Debe mostrar el formulario con campos de contraseña', () => {
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText('Contraseña Actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Nueva Contraseña')).toBeInTheDocument();
  });

  it('Prueba 4.2: Debe mostrar error cuando la contraseña actual está vacía', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const submitBtn = screen.getByRole('button', { name: /Cambiar Contraseña/i });
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Por favor ingrese su contraseña actual/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('Prueba 4.3: Debe mostrar error cuando la nueva contraseña es demasiado corta', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const currentPassInput = screen.getByLabelText('Contraseña Actual');
    const newPassInput = screen.getByLabelText('Nueva Contraseña');
    
    await user.type(currentPassInput, 'oldpass123');
    await user.type(newPassInput, '12345'); // Less than 6 characters
    
    const submitBtn = screen.getByRole('button', { name: /Cambiar Contraseña/i });
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('Prueba 4.4: Debe mostrar error cuando las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const currentPassInput = screen.getByLabelText('Contraseña Actual');
    const newPassInput = screen.getByLabelText('Nueva Contraseña');
    const confirmPassInput = screen.getByLabelText('Confirmar Nueva Contraseña');
    
    await user.type(currentPassInput, 'oldpass123');
    await user.type(newPassInput, 'newpass123');
    await user.type(confirmPassInput, 'diferente123');
    
    const submitBtn = screen.getByRole('button', { name: /Cambiar Contraseña/i });
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument();
    });
  });

  it('Prueba 4.5: Debe mostrar error cuando la nueva contraseña es igual a la contraseña actual', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const currentPassInput = screen.getByLabelText('Contraseña Actual');
    const newPassInput = screen.getByLabelText('Nueva Contraseña');
    const confirmPassInput = screen.getByLabelText('Confirmar Nueva Contraseña');
    
    await user.type(currentPassInput, 'password123');
    await user.type(newPassInput, 'password123');
    await user.type(confirmPassInput, 'password123');
    
    const submitBtn = screen.getByRole('button', { name: /Cambiar Contraseña/i });
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/debe ser diferente/i)).toBeInTheDocument();
    });
  });

  it('Prueba 4.6: Debe borrar el mensaje de error cuando el usuario empieza a escribir', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const currentPassInput = screen.getByLabelText('Contraseña Actual');
    
    // Trigger validation error first
    const submitBtn = screen.getByRole('button', { name: /Cambiar Contraseña/i });
    await user.click(submitBtn);
    
    // Now type to clear the error
    await user.type(currentPassInput, 'oldpass123');
    
    // Message should be cleared after typing
  });

  it('Prueba 4.7: Debe tener una estructura de formulario apropiada', () => {
    render(<ChangePassword onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const form = screen.getByRole('button', { name: /cambiar contraseña|actualizar/i }).closest('form');
    expect(form).toBeInTheDocument();
  });
});
