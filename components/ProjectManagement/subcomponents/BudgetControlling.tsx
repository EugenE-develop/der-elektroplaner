import React, { FC } from 'react';
import { Project, TimeEntry, SupplierInvoice, User } from '../../../types';

interface BudgetControllingProps {
    project: Project;
    onUpdateProject: (id: string, updates: Partial<Project>) => void;
    timeEntries: TimeEntry[];
    supplierInvoices: SupplierInvoice[];
    users: User[];
}

const BudgetControlling: FC<BudgetControllingProps> = ({ project }) => {
    return (
        <div>
            <h3>Budget &amp; Controlling for {project.name}</h3>
            <p>Component content will be implemented here.</p>
        </div>
    );
};

export default BudgetControlling;