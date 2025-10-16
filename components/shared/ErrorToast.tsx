import React, { FC } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const ErrorToast: FC = () => {
    const { errors, clearError } = useAppContext();

    if (!errors || errors.length === 0) {
        return null;
    }

    const renderErrorMessage = (error: { id: string; message: string; details?: any }) => {
        if (typeof error.message === 'string' && error.message.includes("Could not find the table 'public.system_settings'")) {
            return (
                <>
                    <p className="font-bold">Datenbank-Setup unvollständig</p>
                    <p className="text-sm">Die Tabelle 'system_settings' fehlt. Bitte erstellen Sie diese in Ihrer Supabase-Datenbank, damit die Systemeinstellungen funktionieren.</p>
                </>
            );
        }
        
        // Safeguard against non-string error messages
        const message = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);

        return (
            <>
                <p className="font-bold">Ein Fehler ist aufgetreten</p>
                <p className="text-sm">{message}</p>
            </>
        );
    }

    return (
        <div className="fixed top-20 right-4 z-50 w-full max-w-sm space-y-3">
            {errors.map((error) => (
                <div 
                    key={error.id} 
                    className="bg-red-50 border-l-4 border-danger text-danger p-4 rounded-r-lg shadow-lg flex justify-between items-start animate-fade-in-right"
                    role="alert"
                >
                    <div>
                        {renderErrorMessage(error)}
                    </div>
                    <button 
                        onClick={() => clearError(error.id)} 
                        className="ml-4 text-xl font-bold leading-none"
                        aria-label="Fehler ausblenden"
                    >
                        &times;
                    </button>
                </div>
            ))}
            <style>{`
                @keyframes fade-in-right {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ErrorToast;