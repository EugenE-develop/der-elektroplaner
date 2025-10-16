// components/LoginScreen/LoginScreen.test.tsx
// FIX: Replaced placeholder content with tests for the LoginScreen component.
import React from 'react';
// FIX: Corrected imports to use the custom render and other utilities from test-utils.
import { render, screen, fireEvent } from '../../tests/test-utils';
import LoginScreen from './LoginScreen';
// FIX: Imported test globals from vitest to resolve TS errors.
import { vi, describe, it, expect } from 'vitest';

// Mock the supabase client to avoid actual network calls
vi.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('LoginScreen', () => {
  it('renders the login form correctly', () => {
    render(<LoginScreen />);
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    render(<LoginScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    expect(await screen.findByText('Bitte geben Sie eine gültige E-Mail-Adresse ein.')).toBeInTheDocument();
    expect(await screen.findByText('Bitte geben Sie Ihr Passwort ein.')).toBeInTheDocument();
  });

  it('submits the form with valid data and calls supabase auth', async () => {
    const { supabase } = await import('../../supabaseClient');
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ error: null });

    render(<LoginScreen />);
    
    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});