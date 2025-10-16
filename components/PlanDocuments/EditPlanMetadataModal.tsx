import React, { FC, useState } from 'react';
import { DocumentFile } from '../../types';

interface EditPlanMetadataModalProps {
    file: File;
    onClose: () => void;
    onSave: (metadata: Partial<DocumentFile>) => void;
}

const leistungphasenOptions = [
    'LP1: Grundlagenermittlung',
    'LP2: Vorplanung',
    'LP3: Entwurfsplanung',
    'LP4: Genehmigungsplanung',
    'LP5: Ausführungsplanung',
    'LP6: Vorbereitung Vergabe',
    'LP7: Mitwirkung Vergabe',
    'LP8: Objektüberwachung',
    'LP9: Objektbetreuung',
];

const EditPlanMetadataModal: FC<EditPlanMetadataModalProps> = ({ file, onClose, onSave }) => {
    const [metadata, setMetadata] = useState<Partial<DocumentFile>>({
        leistungsphase: '',
        gebaeudeteil: '',
        geschoss: '',
        planIndex: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(metadata);
    };

    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition";

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <h3 className="text-xl font-semibold mb-2">Plan-Details festlegen</h3>
                    <p className="text-sm text-text-light mb-6">Ordnen Sie die Datei <span className="font-medium">"{file.name}"</span> korrekt zu.</p>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Leistungsphase</label>
                                <select name="leistungsphase" value={metadata.leistungsphase} onChange={handleChange} className={commonInputClasses}>
                                    <option value="">Bitte wählen...</option>
                                    {leistungphasenOptions.map(lp => <option key={lp} value={lp}>{lp}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Gebäudeteil</label>
                                <input name="gebaeudeteil" value={metadata.gebaeudeteil} onChange={handleChange} placeholder="z.B. Hauptgebäude, Anbau" className={commonInputClasses} />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Geschoss</label>
                                <input name="geschoss" value={metadata.geschoss} onChange={handleChange} placeholder="z.B. EG, 1. OG, KG" className={commonInputClasses} />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Plan-Index</label>
                                <input name="planIndex" value={metadata.planIndex} onChange={handleChange} placeholder="z.B. a, b, c" className={commonInputClasses} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                        <button type="submit" className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern & Hochladen</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPlanMetadataModal;