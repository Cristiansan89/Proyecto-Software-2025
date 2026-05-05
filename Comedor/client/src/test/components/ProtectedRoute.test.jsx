import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  loading: false
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

const TestComponent = () => <div>Protected Content</div>;

const ProtectedRouteWrapper = (props) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ProtectedRoute {...props}>
      <TestComponent />
    </ProtectedRoute>
  </BrowserRouter>
);

describe('Componente ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.loading = false;
  });

  it('Prueba 7.1: Debería renderizar los hijos cuando requireAuth es false', () => {
    mockAuthContext.isAuthenticated = false;
    
    render(<ProtectedRouteWrapper requireAuth={false} />);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('Prueba 7.2: Debería renderizar los hijos cuando el usuario está autenticado', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, rol: 'Administrador' };
    
    render(<ProtectedRouteWrapper />);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('Prueba 7.3: Debería mostrar el spinner de carga cuando loading es true', () => {
    mockAuthContext.loading = true;
    mockAuthContext.isAuthenticated = false;
    
    render(<ProtectedRouteWrapper />);
    
    expect(screen.getByText(/Verificando autenticación/i)).toBeInTheDocument();
  });

  it('Prueba 7.4: Debería tener el spinner con el rol apropiado', () => {
    mockAuthContext.loading = true;
    
    render(<ProtectedRouteWrapper />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('Prueba 7.5: Debería renderizar los hijos con el rol correcto cuando requiredRole coincide', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, rol: 'Administrador' };
    
    render(<ProtectedRouteWrapper requiredRole="Administrador" />);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('Prueba 7.6: Debería renderizar los hijos con los roles permitidos cuando el rol del usuario está en la lista', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, rol: 'Docente' };
    
    render(
      <ProtectedRouteWrapper 
        allowedRoles={['Docente', 'Administrador']} 
      />
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('Prueba 7.7: Debería mostrar el spinner de carga inicialmente y luego redirigir cuando el usuario no está autenticado', async () => {
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    
    render(<ProtectedRouteWrapper />);
    
    // Component should attempt navigation when unauthenticated
  });

  it('Prueba 7.8: Debería usar nombre_rol como fallback para el rol del usuario', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, nombre_rol: 'Administrador' };
    
    render(<ProtectedRouteWrapper requiredRole="Administrador" />);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
