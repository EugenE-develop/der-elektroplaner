import React, { FC } from 'react';
import { Project, Invoice, Contact, TimeEntry, User } from '../../types';

interface AusgangsrechnungenProps {
    project: Project;
    invoices: Invoice[];
    contacts: Contact[];
    onAction: (action: string, data: any) => void;
    timeEntries: TimeEntry[];
    users: User[];
}

const Ausgangsrechnungen: FC<AusgangsrechnungenProps> = ({ project }) => {
    return (
        <div>
            <h3>Ausgangsrechnungen for {project.name}</h3>
            <p>Component content will be implemented here.</p>
        </div>
    );
};

export default Ausgangsrechnungen;
