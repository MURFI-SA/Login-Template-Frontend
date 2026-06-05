import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../Register';

const mockRegisterMutate = vi.fn();
const mockVerifyMutate = vi.fn();

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
        login: { useMutation: vi.fn() },
        register: { 
          useMutation: vi.fn().mockImplementation((options) => ({ 
            mutate: (vars: any) => {
              mockRegisterMutate(vars);
              if (vars.email === 'error@example.com') {
                if (options?.onError) options.onError({ message: 'Email ya en uso' });
              } else if (options?.onSuccess) {
                options.onSuccess({ message: 'Success' });
              }
            }, 
            isPending: false 
          })) 
        },
        forgotPassword: { useMutation: vi.fn() },
        resetPassword: { useMutation: vi.fn() },
        verifyEmail: { 
          useMutation: vi.fn().mockImplementation((options) => ({
             mutate: (vars: any) => {
               mockVerifyMutate(vars);
               if (options?.onSuccess) {
                 options.onSuccess();
               }
             },
             isPending: false
          })) 
        },
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

vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({ children, onChange }: any) => (
    <div data-testid="input-otp">
      <input data-testid="otp-input" onChange={(e) => onChange(e.target.value)} />
      {children}
    </div>
  ),
  InputOTPGroup: ({ children }: any) => <div>{children}</div>,
  InputOTPSlot: () => <div />,
}));

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clicks return to login", () => {
    render(<Register />);
    const loginLink = screen.getByText("Ya tengo cuenta");
    fireEvent.click(loginLink);
  });

  it('renders correctly', () => {
    render(<Register />);
    expect(screen.getByText('Crear cuenta')).toBeInTheDocument();
    expect(screen.getByTestId('lightrays')).toBeInTheDocument();
  });

  it('shows validation error when email is empty', () => {
    render(<Register />);
    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.submit(button.closest('form')!);
    expect(screen.getByText('Ingresa tu email.')).toBeInTheDocument();
  });

  it('shows validation error when email is invalid', async () => {
    render(<Register />);
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'invalid-email');
    
    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.submit(button.closest('form')!);
    
    expect(screen.getByText('El email no tiene un formato valido.')).toBeInTheDocument();
  });

  it('shows validation error when password is weak (less than 8 chars)', async () => {
    render(<Register />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contrasena/i);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'weak');
    
    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.submit(button.closest('form')!);
    
    const elements = screen.getAllByText('Mínimo 8 caracteres');
    expect(elements.length).toBeGreaterThan(1);
  });

  it('calls register mutation and transitions to verification step', async () => {
    render(<Register />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contrasena/i);
    const confirmInput = screen.getByLabelText(/Repetir contraseña/i);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'StrongPass1!');
    await userEvent.type(confirmInput, 'StrongPass1!');
    
    const button = screen.getByRole('button', { name: /Continuar/i });
    
    expect(button).not.toBeDisabled();
    fireEvent.submit(button.closest('form')!);
    
    await waitFor(() => {
      expect(mockRegisterMutate).toHaveBeenCalledWith({ email: 'test@example.com', password: 'StrongPass1!' });
    });
    
    expect(screen.getByText('Código de verificación')).toBeInTheDocument();
    
    // Step 2: Submit OTP
    const otpInputEl = await screen.findByTestId('otp-input');
    fireEvent.change(otpInputEl, { target: { value: '123456' } });
    const verifyBtn = await screen.findByRole('button', { name: /Verificar email/i });
    fireEvent.submit(verifyBtn.closest('form')!);
    
    expect(mockVerifyMutate).toHaveBeenCalledWith({ email: 'test@example.com', codigo: '123456' });
  });

  it('shows error when passwords do not match', async () => {
    render(<Register />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contrasena/i);
    const confirmInput = screen.getByLabelText(/Repetir contraseña/i);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmInput, 'Password1234!');
    
    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.submit(button.closest('form')!);
    
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    render(<Register />);
    
    await userEvent.type(screen.getByLabelText(/Email/i), 'error@example.com');
    await userEvent.type(screen.getByLabelText(/Contrasena/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Repetir contraseña/i), 'Password123!');
    
    fireEvent.submit(screen.getByRole('button', { name: /Continuar/i }).closest('form')!);

    expect(await screen.findByText('Email ya en uso')).toBeInTheDocument();
  });
});
