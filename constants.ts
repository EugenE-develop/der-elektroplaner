// FIX: Changed import to be a relative path.
import { Leistungsphase, UserRole } from './types';

export const USER_ROLES: UserRole[] = ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'];

export const VIEW_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    hoai: 'HOAI Rechner',
    leistungsbilanz: 'Leistungsbilanz',
    fragenkatalog: 'Fragenkatalog',
    projekte: 'Projekte',
    projektauslastung: 'Zeitstrahl',
    wiki: 'Wiki',
    vorlagen: 'Checklisten',
    benutzer: 'Benutzer',
    einstellungen: 'Einstellungen',
    kostenanalyse: 'Kostenanalyse',
    dokumentvorlagen: 'Dokumente',
    kontakte: 'Kontakte',
    finanzen: 'Finanzen',
    berichte: 'Berichte',
    stammdaten: 'Stammdaten',
    systemeinstellungen: 'Systemeinstellungen',
    'admin-dashboard': 'Admin Dashboard',
    analyse: 'Analyse-Center',
    zeiterfassung: 'Zeiterfassung',
    buero: 'Büro',
    systemprotokoll: 'Systemprotokoll',
    integrationen: 'Integrationen',
    rollen: 'Rollen & Rechte',
};

export const SUBVIEW_LABELS: Record<string, string> = {
    overview: 'Übersicht',
    'gantt-echarts': 'Gantt-Diagramm',
    checklist: 'Checklisten',
    todo: 'Aufgaben (ToDo)',
    diary: 'Bautagebuch',
    budget: 'Budget & Controlling',
    stakeholders: 'Projektbeteiligte',
    memos: 'Aktennotizen',
    plans: 'Planunterlagen',
    schematics: 'Strangschemen & Details',
    documents: 'Technische Unterlagen',
    specifications: 'Leistungsverzeichnis',
    attachments: 'Allg. Anhänge',
    report: 'Erläuterungsbericht',
    fire: 'Brandschutz',
    angebote: 'Angebote',
};

export const LEISTUNGSPHASEN_COLORS: { [key: number]: string } = {
  1: '#38bdf8', // sky-400
  2: '#2dd4bf', // teal-400
  3: '#4ade80', // green-400
  4: '#a3e635', // lime-400
  5: '#facc15', // yellow-400
  6: '#fb923c', // orange-400
  7: '#f87171', // red-400
  8: '#c084fc', // purple-400
  9: '#818cf8', // indigo-400
};


export const initialLeistungsphasen: Leistungsphase[] = [
  { id: 1, name: 'LP1: Grundlagenermittlung', prozent: 2, checked: false },
  { id: 2, name: 'LP2: Vorplanung', prozent: 7, checked: false },
  { id: 3, name: 'LP3: Entwurfsplanung', prozent: 15, checked: false },
  { id: 4, name: 'LP4: Genehmigungsplanung', prozent: 3, checked: false },
  { id: 5, name: 'LP5: Ausführungsplanung', prozent: 25, checked: false },
  { id: 6, name: 'LP6: Vorbereitung Vergabe', prozent: 10, checked: false },
  { id: 7, name: 'LP7: Mitwirkung Vergabe', prozent: 4, checked: false },
  { id: 8, name: 'LP8: Objektüberwachung', prozent: 32, checked: false },
  { id: 9, name: 'LP9: Objektbetreuung', prozent: 2, checked: false },
];

export const DEFAULT_CHECKLIST_ITEMS: { [key: number]: { text: string }[] } = {
  1: [
    { text: 'Klärung der Aufgabenstellung im Hinblick auf die elektrotechnischen Anlagen mit dem Auftraggeber.' },
    { text: 'Beratung zum gesamten Leistungsbedarf (z. B. Stromversorgung, Sicherheitsanforderungen, Kommunikationssysteme, IT, Beleuchtung, Fördertechnik-Schnittstellen).' },
    { text: 'Erfassen der technischen und bauphysikalischen Rahmenbedingungen (z. B. Energieversorgung, vorhandene Anschlüsse, Lastannahmen).' },
    { text: 'Abstimmung mit anderen Fachdisziplinen (Architektur, HLS, Tragwerk, Bauphysik).' },
    { text: 'Erste Beratung zu Genehmigungserfordernissen und möglichen behördlichen Vorgaben.' },
    { text: 'Erstellung einer ersten Dokumentation: Protokolle, Zusammenfassung der Grundlagen, ggf. Vorabskizzen.' },
  ],
  2: [
    { text: 'Analyse der Grundlagen (aus LP 1, Baugrundlagen, Bestandsaufnahmen, Lastprofile).' },
    { text: 'Erarbeitung eines Planungskonzepts für die elektrotechnischen Anlagen:' },
    { text: 'Energieversorgung (Starkstrom, Verteilungen, Zählerkonzepte).' },
    { text: 'Beleuchtungskonzept.' },
    { text: 'Sicherheitsanlagen (Brandmeldeanlage, Sprachalarmierung, Einbruchmeldeanlage, Zutrittskontrolle).' },
    { text: 'Datennetz, TK, IT-Infrastruktur.' },
    { text: 'Gebäudeautomation.' },
    { text: 'Darstellung von System- und Variantenuntersuchungen (z. B. verschiedene Versorgungskonzepte, Redundanzen, Energieeffizienz, Nachhaltigkeit).' },
    { text: 'Abstimmung des Konzepts mit dem Auftraggeber und anderen Fachplanern.' },
    { text: 'Kostenschätzung nach DIN 276 für die elektrotechnischen Anlagen.' },
    { text: 'Zusammenstellung der wesentlichen Ergebnisse (z. B. Vorplanungsbericht, Grobpläne, Funktionsschemata).' },
    { text: 'Mitwirken bei Genehmigungen (Abstimmung mit Versorgern, Behörden, Brandschutzdienststellen etc.).' },
  ]
};

export const KOSTENGRUPPEN_DATA = [
    { id: '440', title: '>> Kostengruppe 440 Elektrische Anlagen', level: 0, items: [
        { id: '441', title: '> Kostengruppe 441 Hoch- und Mittelspannungsanlagen', level: 1, items: [
            { id: '4411', title: 'Schaltanlagen', level: 2 },
            { id: '4412', title: 'Transformatoren', level: 2 },
        ]},
        { id: '442', title: '> Kostengruppe 442 Eigenstromversorgungsanlagen', level: 1, items: [
            { id: '4421', title: 'Rotierende Anlagen', level: 2 },
            { id: '4422', title: 'Statische Anlagen mit Wechselrichter', level: 2 },
            { id: '4423', title: 'Zentrale Batterieanlagen', level: 2 },
            { id: '4424', title: 'Photovoltaikanlagen', level: 2 },
        ]},
        { id: '443', title: '> Kostengruppe 443 Niederspannungsschaltanlagen', level: 1, items: [
            { id: '4431', title: 'Niederspannungshauptverteiler', level: 2 },
            { id: '4433', title: 'Blindstromkompensationsanlagen', level: 2 },
            { id: '4434', title: 'Maximumüberwachungsanlage', level: 2 },
            { id: '4435', title: 'Oberschwingungsfilter', level: 2 },
        ]},
        { id: '444', title: '> Kostengruppe 444 Niederspannungsinstallationsanlagen', level: 1, items: [
            { id: '4441', title: 'Kabel und Leitungen', level: 2 },
            { id: '4442', title: 'Unterverteiler', level: 2 },
            { id: '4443', title: 'Verlegesysteme', level: 2 },
            { id: '4444', title: 'Elektromobilität, Kfz-Ladestationen (nicht offiziell DIN276)', level: 2 },
        ]},
        { id: '445', title: '> Kostengruppe 445 Beleuchtungsanlagen', level: 1, items: [
            { id: '4451', title: 'Ortsfeste Leuchten für Allgemeinbeleuchtung', level: 2 },
            { id: '4452', title: 'Ortsfeste Leuchten für Sicherheitsbeleuchtung', level: 2 },
            { id: '4453', title: 'Leuchten für Verkehrsanlagen', level: 2 },
        ]},
        { id: '446', title: '> Kostengruppe 446 Blitzschutz- und Erdungsanlagen', level: 1, items: [
            { id: '4461', title: 'Auffangseinrichtungen, Ableitungen', level: 2 },
            { id: '4462', title: 'Erdungen', level: 2 },
            { id: '4463', title: 'Potentialausgleich', level: 2 },
        ]},
        { id: '447', title: '> Kostengruppe 447 Fahrleitungssysteme', level: 1, items: [
            { id: '4471', title: 'Fahrleitungssysteme', level: 2 },
        ]},
        { id: '449', title: '> Kostengruppe 449 Sonstiges zur KG 440', level: 1, items: [
            { id: '4491', title: 'Frequenzumformer', level: 2 },
            { id: '4492', title: 'Kleinspannungstransformatoren', level: 2 },
        ]},
    ]},
    { id: '450', title: '>> Kostengruppe 450 Kommunikations-, sicherheits- und informationstechnische Anlagen', level: 0, items: [
        { id: '451', title: '> Kostengruppe 451 Telekommunikationsanlagen', level: 1, items: [
            { id: '4511', title: 'Telekommunikationsanlagen', level: 2 },
        ]},
        { id: '452', title: '> Kostengruppe 452 Such- und Signalanlagen', level: 1, items: [
            { id: '4521', title: 'Personenrufanlagen', level: 2 },
            { id: '4522', title: 'Lichtruf- und Klingelanlagen', level: 2 },
            { id: '4523', title: 'Türsprech- und Türöffneranlagen', level: 2 },
        ]},
        { id: '453', title: '> Kostengruppe 453 Zeitdienstanlagen', level: 1, items: [
            { id: '4531', title: 'Uhrenanlagen', level: 2 },
            { id: '4532', title: 'Zeiterfassungsanlagen', level: 2 },
        ]},
        { id: '454', title: '> Kostengruppe 454 Elektroakustische Anlagen', level: 1, items: [
            { id: '4541', title: 'Beschallungsanlagen', level: 2 },
            { id: '4542', title: 'Konferenz- und Dolmetscheranlagen', level: 2 },
            { id: '4543', title: 'Gegen- und Wechselsprechanlagen', level: 2 },
        ]},
        { id: '455', title: '> Kostengruppe 455 Audiovisuelle Medien- und Antennenanlagen', level: 1, items: [
            { id: '4551', title: 'Fernseh- und Rundfunkempfangsanlagen', level: 2 },
            { id: '4552', title: 'Fernseh- und Rundfunkwahlverteilanlagen', level: 2 },
            { id: '4553', title: 'Fernseh- und Rundfunkzentralen', level: 2 },
            { id: '4554', title: 'Videoanlagen', level: 2 },
            { id: '4555', title: 'Funk-, Sende- und Empfangsanlagen', level: 2 },
            { id: '4556', title: 'Funknetze', level: 2 },
        ]},
        { id: '456', title: '> Kostengruppe 456 Gefahrenmelde- und Alarmanlagen', level: 1, items: [
            { id: '4561', title: 'Brandmeldeanlagen', level: 2 },
            { id: '4562', title: 'Überfall-, Einbruchmeldeanlagen', level: 2 },
            { id: '4563', title: 'Wächterkontrollanlagen', level: 2 },
            { id: '4564', title: 'Zutrittskontrollanlagen', level: 2 },
            { id: '4565', title: 'Raumbeobachtungsanlagen', level: 2 },
            { id: '4566', title: 'Videoüberwachungsanlagen', level: 2 },
        ]},
        { id: '457', title: '> Kostengruppe 457 Datenübertragungsnetze', level: 1, items: [
            { id: '4571', title: 'Datenübertragungsnetze', level: 2 },
        ]},
        { id: '458', title: '> Kostengruppe 458 Verkehrsbeeinflussungsanlagen', level: 1, items: [
            { id: '4581', title: 'Verkehrssignalanlagen', level: 2 },
            { id: '4582', title: 'elektronische Anzeigetafeln', level: 2 },
            { id: '4583', title: 'Mautsysteme, Mautzählung', level: 2 },
            { id: '4584', title: 'Mautsysteme, Mautüberwachung', level: 2 },
            { id: '4585', title: 'Parkleitsysteme', level: 2 },
            { id: '4586', title: 'Verkehrstelematik', level: 2 },
        ]},
        { id: '459', title: '> Kostengruppe 459 Sonstiges zur KG 450', level: 1, items: [
            { id: '4591', title: 'Verlegesysteme', level: 2 },
            { id: '4592', title: 'Personenleitsysteme', level: 2 },
            { id: '4593', title: 'Parkhausleitsysteme', level: 2 },
            { id: '4594', title: 'Fernwirkanlagen', level: 2 },
        ]},
    ]},
    { id: '460', title: '>> Kostengruppe 460 Förderanlagen', level: 0, items: [
        { id: '461', title: '> Kostengruppe 461 Aufzugsanlagen', level: 1, items: [
            { id: '4611', title: 'Personenaufzüge', level: 2 },
            { id: '4612', title: 'Lastenaufzüge', level: 2 },
            { id: '4613', title: 'Kleingüteraufzüge', level: 2 },
        ]},
        { id: '462', title: '> Kostengruppe 462 Fahrtreppen, Fahrsteige', level: 1, items: [
            { id: '4621', title: 'Fahrtreppen', level: 2 },
            { id: '4622', title: 'Fahrsteige', level: 2 },
        ]},
        { id: '463', title: '> Kostengruppe 463 Befahranlagen', level: 1, items: [
            { id: '4631', title: 'Fassadenbefahranlagen', level: 2 },
        ]},
        { id: '464', title: '> Kostengruppe 464 Transportanlagen', level: 1, items: [
            { id: '4641', title: 'Automatische Warentransportanlagen', level: 2 },
            { id: '4642', title: 'Kleingüterförderanlagen', level: 2 },
            { id: '4643', title: 'Rohrpostanlagen', level: 2 },
        ]},
        { id: '465', title: '> Kostengruppe 465 Krananlagen', level: 1, items: [
            { id: '4651', title: 'Krananlagen', level: 2 },
        ]},
        { id: '466', title: '> Kostengruppe 466 Hydraulikanlagen', level: 1, items: [
            { id: '4661', title: 'Hydraulikanlagen', level: 2 },
        ]},
        { id: '469', title: '> Kostengruppe 469 Sonstiges zur KG 460', level: 1, items: [
            { id: '4691', title: 'Hebebühnen', level: 2 },
            { id: '4692', title: 'Parksysteme', level: 2 },
        ]},
    ]},
];


export const ELECTRICAL_SYSTEMS: Record<string, string[]> = {
  'KG 440 - Starkstromanlagen': [
    'Hoch- und Mittelspannungsanlagen',
    'Eigenstromversorgungsanlagen',
    'Niederspannungsschaltanlagen',
    'Niederspannungsinstallationsanlagen',
    'Beleuchtungsanlagen',
    'Blitzschutz- und Erdungsanlagen',
    'Sonstige Starkstromanlagen',
  ],
  'KG 450 - Fernmelde- und informationstechnische Anlagen': [
    'Telekommunikationsanlagen',
    'Such- und Signalanlagen',
    'Gefahrenmeldeanlagen',
    'Übertragungsnetze',
    'Fernseh- und Antennenanlagen',
    'Elektroakustische Anlagen',
    'Sonstige Fernmeldeanlagen',
  ],
  'KG 460 - Förderanlagen': [
    'Aufzugsanlagen',
    'Fahrtreppen, Fahrsteige',
    'Befahranlagen',
    'Transportanlagen',
    'Krananlagen',
    'Sonstige Förderanlagen',
  ],
  'KG 480 - Gebäudeautomation': [
    'Automationssysteme',
    'Schaltschränke',
    'Management- und Bedieneinrichtungen',
    'Raumautomationssysteme',
    'Sonstige Gebäudeautomation',
  ],
};

// --- HOAI Rechner Konstanten ---

export const LEISTUNGSBILDER = [
    { id: 'technische-ausruestung', name: 'Technische Ausrüstung (§ 55 HOAI)', paragraph: '§ 56 Abs. 1' }
];

export const HONORARZONEN = [
    { id: 'I', name: 'Honorarzone I', description: 'sehr geringe Anforderungen' },
    { id: 'II', name: 'Honorarzone II', description: 'geringe Anforderungen' },
    { id: 'III', name: 'Honorarzone III', description: 'durchschnittliche Anforderungen' },
    { id: 'IV', name: 'Honorarzone IV', description: 'hohe Anforderungen' },
    { id: 'V', name: 'Honorarzone V', description: 'sehr hohe Anforderungen' },
];

// Honorartafel zu § 56 Abs. 1 HOAI 2021 für Technische Ausrüstung
export const HOAI_TABLE_TECH_AUSRUESTUNG = [
  { kosten: 25000, zoneI: [2611, 3120], zoneII: [3120, 3654], zoneIII: [3654, 4298] },
  { kosten: 50000, zoneI: [4629, 5529], zoneII: [5529, 6480], zoneIII: [6480, 7622] },
  { kosten: 100000, zoneI: [8061, 9631], zoneII: [9631, 11290], zoneIII: [11290, 13279] },
  { kosten: 250000, zoneI: [17336, 20716], zoneII: [20716, 24285], zoneIII: [24285, 28564] },
  { kosten: 500000, zoneI: [30401, 36321], zoneII: [36321, 42583], zoneIII: [42583, 50086] },
  { kosten: 1000000, zoneI: [52136, 62286], zoneII: [62286, 73024], zoneIII: [73024, 85892] },
  { kosten: 2500000, zoneI: [108521, 129651], zoneII: [129651, 152011], zoneIII: [152011, 178800] },
  { kosten: 5000000, zoneI: [186000, 222100], zoneII: [222100, 260400], zoneIII: [260400, 306300] },
  { kosten: 10000000, zoneI: [315800, 377200], zoneII: [377200, 442300], zoneIII: [442300, 520200] },
  { kosten: 25000000, zoneI: [642000, 766900], zoneII: [766900, 899200], zoneIII: [899200, 1057600] },
];

export const HOAI_TABLES: { [key: string]: typeof HOAI_TABLE_TECH_AUSRUESTUNG } = {
    'technische-ausruestung': HOAI_TABLE_TECH_AUSRUESTUNG
};