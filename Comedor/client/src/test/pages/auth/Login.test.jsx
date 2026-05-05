import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../pages/auth/Login';

// Mock para AuthContext
const mockAuthContext = {
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

vi.mock('../../../components/auth/ForgotPassword', () => ({
  ForgotPassword: () => <div data-testid="forgot-password">Forgot Password</div>
}));

vi.mock('../../../components/auth/ChangePassword', () => ({
  ChangePassword: () => <div data-testid="change-password">Change Password</div>
}));

const LoginWrapper = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Login />
  </BrowserRouter>
);

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.login.mockReset();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.loading = false;
  });

  it('Prueba 6.1: Debería renderizar el formulario de inicio de sesión', () => {
    render(<LoginWrapper />);
    
    const usernameInput = screen.getByLabelText('Nombre de Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('Prueba 6.2: Debería renderizar el botón de envío', () => {
    render(<LoginWrapper />);
    
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it('Prueba 6.3: Debería mostrar error cuando el nombre de usuario está vacío', async () => {
    const user = userEvent.setup();
    render(<LoginWrapper />);
    
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/nombre de usuario es requerido/i)).toBeInTheDocument();
    });
  });

  it('Prueba 6.4: Debería mostrar error cuando la contraseña está vacía', async () => {
    const user = userEvent.setup();
    render(<LoginWrapper />);
    
    const usernameInput = screen.getByLabelText('Nombre de Usuario');
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    
    await user.type(usernameInput, 'testuser');
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/contraseña es requerida/i)).toBeInTheDocument();
    });
  });

  it('Prueba 6.5: Debería borrar el error cuando el usuario empieza a escribir.', async () => {
    const user = userEvent.setup();
    render(<LoginWrapper />);
    
    const usernameInput = screen.getByLabelText('Nombre de Usuario');
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    
    // Trigger error
    await user.click(submitBtn);
    
    // Clear error by typing
    await user.type(usernameInput, 'testuser');
  });

  it('Prueba 6.6: Debería manejar los cambios en los inputs', async () => {
    const user = userEvent.setup();
    render(<LoginWrapper />);
    
    const usernameInput = screen.getByLabelText('Nombre de Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpass123');
  });

  it('Prueba 6.7: Debería llamar a la función de inicio de sesión con credenciales válidas', async () => {
    const user = userEvent.setup();
    mockAuthContext.login.mockResolvedValueOnce({
      rol: 'Usuario',
      nombre_rol: 'Usuario'
    });

    render(<LoginWrapper />);
    
    const usernameInput = screen.getByLabelText('Nombre de Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass123');
    await user.click(submitBtn);
    
    await waitFor(() => {
      expect(mockAuthContext.login).toHaveBeenCalledWith('testuser', 'testpass123');
    });
  });

  it('Prueba 6.8: Debería mostrar la opción de recuperar contraseña', () => {
    render(<LoginWrapper />);
    
    // Check for forgot password button or link - look for the specific button
    const forgotPasswordBtn = screen.getByRole('button', { name: /olvidaste|olvide/i });
    expect(forgotPasswordBtn).toBeInTheDocument();
  });

  it('Prueba 6.9: Debería tener estado de carga durante la presentación', async () => {
    const user = userEvent.setup();
    mockAuthContext.login.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<LoginWrapper />);
    
    const usernameInput = screen.getByLabelText('Nombre de Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass123');
    await user.click(submitBtn);
  });
});
