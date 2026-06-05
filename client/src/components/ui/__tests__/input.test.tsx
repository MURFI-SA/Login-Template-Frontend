import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

vi.mock("@/components/ui/dialog", () => ({
  useDialogComposition: vi.fn(() => ({
    setComposing: vi.fn(),
    markCompositionEnd: vi.fn(),
    justEndedComposing: vi.fn(() => false),
  }))
}));

vi.mock("@/hooks/useComposition", () => ({
  useComposition: vi.fn((opts) => ({
    onCompositionStart: opts?.onCompositionStart,
    onCompositionEnd: opts?.onCompositionEnd,
    onKeyDown: opts?.onKeyDown,
  }))
}));

describe('Input', () => {
  it('renders correctly with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
  });

  it('applies custom classes', () => {
    render(<Input placeholder="Enter text" className="custom-class" />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toHaveClass('custom-class');
  });

  it('handles disabled state', () => {
    render(<Input placeholder="Enter text" disabled />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('registers onChange event properly', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input placeholder="Enter text" onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText(/enter text/i);
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalledTimes(4);
    expect(input).toHaveValue('test');
  });
});
