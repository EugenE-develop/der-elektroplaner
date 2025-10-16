import React, { useState, FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../supabaseClient';

const loginSchema = z.object({
    email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
    password: z.string().min(1, { message: 'Bitte geben Sie Ihr Passwort ein.' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginScreen: FC = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });
    const [loginError, setLoginError] = useState('');

    const onSubmit: SubmitHandler<LoginFormInputs> = async ({ email, password }) => {
        setLoginError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('Login error:', error.message);
                if (error.message.includes('Invalid login credentials')) {
                    setLoginError("E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.");
                } else {
                    setLoginError("Ein unbekannter Anmeldefehler ist aufgetreten.");
                }
            }
            // A successful login will be detected by onAuthStateChange in App.tsx
        } catch (error: any) {
            console.error('Unexpected login error:', error.message);
            setLoginError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <div className="w-full max-w-md rounded-lg bg-card p-8 text-center shadow-xl sm:p-12">
                <h2 className="mb-2 text-2xl font-semibold text-text">Willkommen bei HOAI Planer Pro</h2>
                <p className="mb-8 text-text-light">Bitte melden Sie sich an, um fortzufahren.</p>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-6 text-left">
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-light">E-Mail</label>
                        <input
                            type="email"
                            id="email"
                            {...register('email')}
                            className={`w-full rounded-md border border-border bg-card p-3 text-text transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'input-error' : ''}`}
                            placeholder="z.B. user@domain.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                    </div>
                    <div className="mb-6 text-left">
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-light">Passwort</label>
                        <input
                            type="password"
                            id="password"
                            {...register('password')}
                            className={`w-full rounded-md border border-border bg-card p-3 text-text transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.password ? 'input-error' : ''}`}
                        />
                        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
                    </div>
                    {loginError && <p className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-danger dark:bg-danger/20">{loginError}</p>}
                    <button type="submit" className="w-full rounded-md bg-primary py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting}>
                        {isSubmitting ? 'Anmelden...' : 'Anmelden'}
                    </button>
                </form>
                 <div className="mt-8 rounded-md bg-secondary p-4 text-left text-xs text-text-light">
                    <p className="mb-2 font-medium">Hinweis</p>
                    <p>Die Authentifizierung erfolgt nun über Supabase. Bitte verwenden Sie die E-Mail-Adresse und das Passwort eines in Supabase registrierten Benutzers. Neue Benutzer können über die Benutzerverwaltung angelegt werden (erfordert Admin-Rechte).</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;