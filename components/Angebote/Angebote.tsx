
import React, { FC } from 'react';
// FIX: Changed import to be a relative path.
import { Project, Offer, Contact } from '../../types';

interface AngeboteProps {
    project: Project;
    offers: Offer[];
    contacts: Contact[];
    onAction: (action: string, data: any) => void;
}

const Angebote: FC<AngeboteProps> = ({ project, offers, contacts, onAction }) => {
    return (
        <div>
            <h3>Angebote für {project.name}</h3>
            {/* Component content will be implemented here */}
            <p>Angebote component placeholder.</p>
            {offers.length === 0 && <p>Keine Angebote für dieses Projekt.</p>}
            <ul>
                {offers.map(offer => <li key={offer.id}>{offer.offerNumber} - {offer.status}</li>)}
            </ul>
        </div>
    );
};

export default Angebote;
