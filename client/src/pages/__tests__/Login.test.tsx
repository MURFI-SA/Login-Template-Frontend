import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

const mockLoginMutate = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => ['/current-path', vi.fn()]
}));

vi.mock('@/lib/trpc', () => {
  const useUtils = vi.fn().mockReturnValue({ 
    auth: { me: { invalidate: vi.fn(), setData: vi.fn() } },
    client: { auth: { logout: { mutate: vi.fn() } } }
  });
  
  return {
    trpc: {
      useUtils,
      auth: {
        login: { 
          useMutation: vi.fn().mockImplementation((options) => ({ 
            mutate: (vars: any) => {
              mockLoginMutate(vars);
              if (options?.onSuccess) {
                options.onSuccess({ token: 'fake-token' });
              }
            }, 
            isPending: false 
          })) 
        },
        register: { useMutation: vi.fn() },
        forgotPassword: { useMutation: vi.fn() },
        resetPassword: { useMutation: vi.fn() },
        verifyEmail: { useMutation: vi.fn() },
        verifyRecoveryOtp: { useMutation: vi.fn() },
        me: { useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }) }
      }
    }
  };
});

vi.mock('@/components/ui/LightRays', () => ({
  default: () => <div data-testid="lightrays" />
}));

vi.mock('@/components/ThemeToggleButton', () => ({
  ThemeToggleButton: () => <div data-testid="theme-toggle" />
}));

vi.mock('@/_core/hooks/useAuth', () => ({
  setAuthToken: vi.fn()
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Login />);
    expect(screen.getByText('BOT Urgentes')).toBeInTheDocument();
    expect(screen.getByTestId('lightrays')).toBeInTheDocument();
  });

  it('shows validation error when email is empty', () => {
    render(<Login />);
    const button = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.submit(button.closest('form')!);
    expect(screen.getByText('Ingresa tu email.')).toBeInTheDocument();
  });

  it('shows validation error when email is invalid', async () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'invalid-email');
    const button = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.submit(button.closest('form')!);
    expect(screen.getByText('El email no tiene un formato valido.')).toBeInTheDocument();
  });

  it('shows validation error when password is empty', async () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    const button = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.submit(button.closest('form')!);
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument();
  });

  it('calls login mutation when valid data is submitted', async () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    
    const button = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.submit(button.closest('form')!);
    
    await waitFor(() => {
      expect(mockLoginMutate).toHaveBeenCalledWith({ email: 'test@example.com', password: 'Password123!' });
    });
  });
});
