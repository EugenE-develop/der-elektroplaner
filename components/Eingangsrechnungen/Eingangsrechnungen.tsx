import React, { FC } from 'react';
import { Project, SupplierInvoice, Contact } from '../../types';

interface EingangsrechnungenProps {
    project: Project;
    supplierInvoices: SupplierInvoice[];
    contacts: Contact[];
    onAction: (action: string, data: any) => void;
}

const Eingangsrechnungen: FC<EingangsrechnungenProps> = ({ project }) => {
    return (
        <div>
            <h3>Eingangsrechnungen for {project.name}</h3>
            <p>Component content will be implemented here.</p>
        </div>
    );
};

export default Eingangsrechnungen;
