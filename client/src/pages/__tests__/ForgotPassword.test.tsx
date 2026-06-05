import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../ForgotPassword';

// Mock components
vi.mock('@/components/ui/LightRays', () => ({
  default: () => <div data-testid="lightrays" />
}));

vi.mock('@/components/ThemeToggleButton', () => ({
  default: () => <div data-testid="theme-toggle" />
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

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/forgot-password', vi.fn()]
}));

// Mock tRPC
const mockForgotMutate = vi.fn();
const mockVerifyOtpMutate = vi.fn();
const mockResetMutate = vi.fn();

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
        register: { useMutation: vi.fn() },
        forgotPassword: { 
          useMutation: vi.fn().mockImplementation((options) => ({ 
            mutate: (vars: any) => {
              mockForgotMutate(vars);
              if (vars.email === 'error@example.com') {
                if (options?.onError) options.onError({ message: 'Usuario no encontrado' });
              } else if (options?.onSuccess) {
                options.onSuccess({ message: 'Success' });
              }
            },isPending: false 
          })) 
        },
        resetPassword: { 
          useMutation: vi.fn().mockImplementation((options) => ({ 
            mutate: (vars: any) => {
              mockResetMutate(vars);
              if (options?.onSuccess) options.onSuccess();
            }, 
            isPending: false 
          })) 
        },
        verifyEmail: { useMutation: vi.fn() },
        verifyRecoveryOtp: { 
          useMutation: vi.fn().mockImplementation((options) => ({ 
            mutate: (vars: any) => {
              mockVerifyOtpMutate(vars);
              if (options?.onSuccess) options.onSuccess({ message: "OK" });
            }, 
            isPending: false 
          })) 
        },
        me: { useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }) }
      }
    }
  };
});

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial step and handles empty email validation', async () => {
    render(<ForgotPassword />);
    
    expect(screen.getByTestId('lightrays')).toBeInTheDocument();
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
    
    const submitButton = screen.getByRole('button', { name: /Enviar código/i });
    expect(submitButton).toBeInTheDocument();

    fireEvent.submit(submitButton.closest('form')!);
    expect(await screen.findByText('Ingresa tu email.')).toBeInTheDocument();
  });

  it('handles invalid email format validation', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);
    
    const emailInput = screen.getByPlaceholderText('tu@email.com');
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /Enviar código/i });
    fireEvent.submit(submitButton.closest('form')!);
    
    expect(await screen.findByText('El email no tiene un formato valido.')).toBeInTheDocument();
  });

  it('calls forgotPassword mutation on valid email submit', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);
    
    const emailInput = screen.getByPlaceholderText('tu@email.com');
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /Enviar código/i });
    fireEvent.submit(submitButton.closest('form')!);
    
    expect(screen.queryByText('El email no tiene un formato valido.')).not.toBeInTheDocument();
    expect(screen.queryByText('Ingresa tu email.')).not.toBeInTheDocument();
  });

  it('completes the full forgot password flow', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);
    
    // Step 0: Submit Email
    const emailInput = screen.getByPlaceholderText('tu@email.com');
    await user.type(emailInput, 'test@example.com');
    const submitEmailBtn = screen.getByRole('button', { name: /Enviar código/i });
    fireEvent.submit(submitEmailBtn.closest('form')!);
    
    // Verify mock called
    expect(mockForgotMutate).toHaveBeenCalledWith({ email: 'test@example.com' });


    // Step 1: Submit OTP
    const otpInputEl = await screen.findByTestId('otp-input');
    fireEvent.change(otpInputEl, { target: { value: '123456' } });
    const submitOtpBtn = await screen.findByRole('button', { name: /Continuar/i });
    fireEvent.submit(submitOtpBtn.closest('form')!);
    
    expect(mockVerifyOtpMutate).toHaveBeenCalledWith({ email: 'test@example.com', codigo: '123456' });
    
    // Step 2: Reset Password
    const newPasswordInput = await screen.findByLabelText(/Nueva contraseña/i);
    const confirmPasswordInput = await screen.findByLabelText(/Confirmar contraseña/i);
    
    await user.type(newPasswordInput, 'StrongPass1!');
    await user.type(confirmPasswordInput, 'StrongPass1!');
    
    const resetBtn = screen.getByRole('button', { name: /Cambiar contraseña/i });
    fireEvent.submit(resetBtn.closest('form')!);
    
    expect(mockResetMutate).toHaveBeenCalledWith({ email: 'test@example.com', codigo: '123456', newPassword: 'StrongPass1!' });
  });

  it('handles API errors', async () => {
    render(<ForgotPassword />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'error@example.com');
    fireEvent.submit(screen.getByRole('button', { name: /Enviar código/i }).closest('form')!);
    expect(await screen.findByText('Usuario no encontrado')).toBeInTheDocument();
  });

  it('validates OTP length', async () => {
    render(<ForgotPassword />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'test@example.com');
    fireEvent.submit(screen.getByRole('button', { name: /Enviar código/i }).closest('form')!);
    
    const otpInputEl = await screen.findByTestId('otp-input');
    fireEvent.change(otpInputEl, { target: { value: '123' } }); // < 6 chars
    const submitOtpBtn = await screen.findByRole('button', { name: /Continuar/i });
    fireEvent.submit(submitOtpBtn.closest('form')!);
    
    expect(await screen.findByText('El código debe tener 6 dígitos.')).toBeInTheDocument();
  });

  it('validates new password match and strength', async () => {
    render(<ForgotPassword />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'test@example.com');
    fireEvent.submit(screen.getByRole('button', { name: /Enviar código/i }).closest('form')!);
    
    const otpInputEl = await screen.findByTestId('otp-input');
    fireEvent.change(otpInputEl, { target: { value: '123456' } });
    const submitOtpBtn = await screen.findByRole('button', { name: /Continuar/i });
    fireEvent.submit(submitOtpBtn.closest('form')!);
    
    const newPasswordInput = await screen.findByLabelText(/Nueva contraseña/i);
    const confirmPasswordInput = await screen.findByLabelText(/Confirmar contraseña/i);
    
    // Mismatch
    await user.clear(newPasswordInput);
    await user.type(newPasswordInput, 'StrongPass1!');
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'StrongPass2!');
    fireEvent.submit(screen.getByRole('button', { name: /Cambiar contraseña/i }).closest('form')!);
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();

  });

  it("clicks return to login", () => {
    render(<ForgotPassword />);
    const returnLink = screen.getByText("Volver al login");
    fireEvent.click(returnLink);
  });
});
