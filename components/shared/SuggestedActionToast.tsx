import React, { FC } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const SuggestedActionToast: FC = () => {
    const { suggestedAction, setSuggestedAction, handleCreateTimeEntry, currentUser } = useAppContext();

    if (!suggestedAction || !currentUser) {
        return null;
    }

    const handleConfirm = () => {
        try {
            switch (suggestedAction.type) {
                case 'CREATE_TIME_ENTRY':
                    const payload = suggestedAction.payload;
                    // Validate payload
                    if (payload && payload.projectId && payload.duration_hours && payload.service_phase_id) {
                         handleCreateTimeEntry({
                            user_id: currentUser.id,
                            project_id: payload.projectId,
                            service_phase_id: Number(payload.service_phase_id),
                            entry_date: new Date().toISOString().split('T')[0], // Assume today
                            duration_hours: Number(payload.duration_hours),
                            description: payload.description || '',
                        });
                    } else {
                        console.error("Invalid payload for CREATE_TIME_ENTRY", payload);
                    }
                    break;
                // Add other cases here
                default:
                    console.warn(`Unknown suggested action type: ${suggestedAction.type}`);
            }
        } catch (error) {
            console.error("Error executing suggested action:", error);
            // Optionally show an error to the user
        }
        setSuggestedAction(null);
    };

    const handleDismiss = () => {
        setSuggestedAction(null);
    };

    return (
        <div className="suggested-action-toast">
            <div className="toast-content">
                <span className="toast-icon">💡</span>
                <p className="toast-description">{suggestedAction.description}</p>
            </div>
            <div className="toast-actions">
                <button onClick={handleConfirm} className="toast-btn confirm">Bestätigen</button>
                <button onClick={handleDismiss} className="toast-btn dismiss">Verwerfen</button>
            </div>
        </div>
    );
};

export default SuggestedActionToast;