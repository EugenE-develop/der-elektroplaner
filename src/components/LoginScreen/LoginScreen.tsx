import React, { useState, FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../supabaseClient';
import { Mail, Lock } from 'lucide-react';

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
        } catch (error: any) {
            console.error('Unexpected login error:', error.message);
            setLoginError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* Branding Column */}
                <div className="hidden lg:flex flex-col items-center justify-center bg-primary p-12 text-center text-white">
                    <svg className="h-24 w-24 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <h1 className="text-4xl font-bold">HOAI Planer Pro</h1>
                    <p className="mt-4 max-w-sm text-lg text-blue-200">
                        Effiziente Leistungsberechnung und Projektmanagement für Planungsbüros.
                    </p>
                </div>

                {/* Form Column */}
                <div className="flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                         {/* Logo for smaller screens */}
                        <div className="lg:hidden text-center mb-8">
                             <svg className="h-16 w-16 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        
                        <div className="rounded-lg bg-card p-8 sm:p-12 border border-border">
                            <h2 className="text-center mb-2 text-2xl font-semibold text-text">Willkommen zurück</h2>
                            <p className="text-center mb-8 text-text-light">Bitte melden Sie sich an.</p>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-6 text-left relative">
                                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-light">E-Mail</label>
                                    <Mail className="absolute left-3 top-9 h-5 w-5 text-text-light" />
                                    <input
                                        type="email"
                                        id="email"
                                        {...register('email')}
                                        className={`w-full rounded-md border border-border bg-card p-3 pl-10 text-text transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'input-error' : ''}`}
                                        placeholder="user@domain.com"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                                </div>
                                <div className="mb-6 text-left relative">
                                    <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-light">Passwort</label>
                                    <Lock className="absolute left-3 top-9 h-5 w-5 text-text-light" />
                                    <input
                                        type="password"
                                        id="password"
                                        {...register('password')}
                                        className={`w-full rounded-md border border-border bg-card p-3 pl-10 text-text transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.password ? 'input-error' : ''}`}
                                        placeholder="Passwort"
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
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;