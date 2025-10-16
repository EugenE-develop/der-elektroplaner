
import React, { FC, useState, useCallback } from 'react';
import { initialLeistungsphasen, HONORARZONEN, LEISTUNGSBILDER, HOAI_TABLE_TECH_AUSRUESTUNG } from '../../constants';
// FIX: Changed import to be a relative path.
import { Leistungsphase, HOAI_Ergebnis } from '../../types';
import { formatCurrency } from '../../utils';

const HOAIRechner: FC = () => {
    const [anrechenbareKosten, setAnrechenbareKosten] = useState<number>(500000);
    const [leistungsphasen, setLeistungsphasen] = useState<Leistungsphase[]>(initialLeistungsphasen);
    const [honorarzone, setHonorarzone] = useState<string>('III');
    const [honorarsatz, setHonorarsatz] = useState<string>('mittelfeld');
    const [umbauzuschlag, setUmbauzuschlag] = useState<number>(0);
    const [instandhaltungszuschlag, setInstandhaltungszuschlag] = useState<number>(0);
    const [nebenkosten, setNebenkosten] = useState<number>(5);
    const [mwstSatz, setMwstSatz] = useState<number>(19);
    
    const [ergebnis, setErgebnis] = useState<HOAI_Ergebnis | null>(null);

    const calculateGrundhonorar = useCallback((): number => {
        const table = HOAI_TABLE_TECH_AUSRUESTUNG;
        const zoneKeyMap = { 'I': 'zoneI', 'II': 'zoneII', 'III': 'zoneIII' } as const;
        const zoneKey = zoneKeyMap[honorarzone as keyof typeof zoneKeyMap];
        if (!zoneKey) return 0;

        // Find the correct upper bound in the HOAI table
        let upperBound = table.find(row => anrechenbareKosten <= row.kosten);
        let lowerBound;

        if (!upperBound) {
            // Costs are higher than the highest value in the table, extrapolate from the last two entries
            upperBound = table[table.length - 1];
            lowerBound = table[table.length - 2];
        } else {
            const upperBoundIndex = table.indexOf(upperBound);
            if (upperBoundIndex > 0) {
                lowerBound = table[upperBoundIndex - 1];
            } else {
                // Costs are lower than or equal to the first entry, no interpolation needed
                lowerBound = upperBound;
            }
        }

        const lowerZoneFees = lowerBound[zoneKey];
        const upperZoneFees = upperBound[zoneKey];
        if (!lowerZoneFees || !upperZoneFees) return 0;
        
        // Interpolate the fee using the middle rate of the given range
        const h1 = (lowerZoneFees[0] + lowerZoneFees[1]) / 2;
        const h2 = (upperZoneFees[0] + upperZoneFees[1]) / 2;
        const k1 = lowerBound.kosten;
        const k2 = upperBound.kosten;

        // If costs match a table entry exactly or are below the first, return that entry's fee
        if (k1 === k2) return h1;
        
        // Linear interpolation formula: H = H1 + (H2 - H1) * (K - K1) / (K2 - K1)
        const interpolatedHonorar = h1 + (h2 - h1) * (anrechenbareKosten - k1) / (k2 - k1);
        
        return interpolatedHonorar;
    }, [anrechenbareKosten, honorarzone]);

    const handleBerechnen = () => {
        const grundhonorar = calculateGrundhonorar();
        const totalProzent = leistungsphasen.reduce((sum, lp) => lp.checked ? sum + lp.prozent : sum, 0);
        const honorarGrundleistungen = grundhonorar * (totalProzent / 100);
        const umbauzuschlagBetrag = honorarGrundleistungen * (umbauzuschlag / 100);
        const instandhaltungszuschlagBetrag = honorarGrundleistungen * (instandhaltungszuschlag / 100);
        const zwischensumme = honorarGrundleistungen + umbauzuschlagBetrag + instandhaltungszuschlagBetrag;
        const nebenkostenBetrag = zwischensumme * (nebenkosten / 100);
        const netto = zwischensumme + nebenkostenBetrag;
        const mwst = netto * (mwstSatz / 100);
        const brutto = netto + mwst;

        setErgebnis({
            grundhonorar, honorarGrundleistungen, umbauzuschlagBetrag, instandhaltungszuschlagBetrag,
            zwischensumme, nebenkostenBetrag, netto, mwst, brutto, totalProzent
        });
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-text">HOAI Rechner</h2>
            <p className="text-text-light mb-8">Berechnen Sie das Honorar nach HOAI.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                        <h3 className="text-lg font-semibold mb-4">Eingabeparameter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-1">Anrechenbare Kosten (€)</label>
                                <input type="number" value={anrechenbareKosten} onChange={e => setAnrechenbareKosten(Number(e.target.value))} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-1">Honorarzone</label>
                                <select value={honorarzone} onChange={e => setHonorarzone(e.target.value)} className="w-full p-2 border rounded">
                                    {HONORARZONEN.map(hz => <option key={hz.id} value={hz.id}>{hz.name} - {hz.description}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                        <h3 className="text-lg font-semibold mb-4">Leistungsphasen</h3>
                         {leistungsphasen.map(lp => (
                            <div key={lp.id} className="flex items-center justify-between py-1">
                                <label htmlFor={`lp-${lp.id}`} className="flex items-center cursor-pointer">
                                    <input type="checkbox" id={`lp-${lp.id}`} checked={lp.checked} onChange={e => setLeistungsphasen(lps => lps.map(l => l.id === lp.id ? {...l, checked: e.target.checked} : l))} className="h-4 w-4 mr-2" />
                                    {lp.name}
                                </label>
                                <span>{lp.prozent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-1">
                     <div className="bg-card p-6 rounded-lg shadow-sm border border-border sticky top-8">
                         <h3 className="text-lg font-semibold mb-4">Ergebnis</h3>
                         {ergebnis ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Grundhonorar (100%):</span> <strong>{formatCurrency(ergebnis.grundhonorar)}</strong></div>
                                <div className="flex justify-between"><span>Gewählte LPs ({ergebnis.totalProzent}%):</span> <strong>{formatCurrency(ergebnis.honorarGrundleistungen)}</strong></div>
                                <div className="flex justify-between border-t pt-2 mt-2"><span>Netto:</span> <strong>{formatCurrency(ergebnis.netto)}</strong></div>
                                <div className="flex justify-between"><span>+ {mwstSatz}% MwSt.:</span> <strong>{formatCurrency(ergebnis.mwst)}</strong></div>
                                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Brutto:</span> <strong>{formatCurrency(ergebnis.brutto)}</strong></div>
                            </div>
                         ) : <p className="text-text-light">Bitte berechnen Sie das Ergebnis.</p>}
                         <button onClick={handleBerechnen} className="w-full mt-6 py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Berechnen</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default HOAIRechner;
