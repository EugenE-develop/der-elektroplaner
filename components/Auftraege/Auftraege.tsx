import React, { FC } from 'react';
import { Project, Order, Contact } from '../../types';

interface AuftraegeProps {
    project: Project;
    orders: Order[];
    contacts: Contact[];
    onAction: (action: string, data: any) => void;
}

const Auftraege: FC<AuftraegeProps> = ({ project }) => {
    return (
        <div>
            <h3>Aufträge for {project.name}</h3>
            <p>Component content will be implemented here.</p>
        </div>
    );
};

export default Auftraege;
