import { InProcessCategoryItem } from './types';

export interface InProcessSampleCheckpoint {
  id: string;
  checkId: string;
  category: string;
  lineId: string;
  partName: string;
  station: string;
  nominalSpec: string;
  measuredSpec: string;
  status: 'pass' | 'fail' | 'pending';
  inspector: string;
  timestamp: string;
}

export const IN_PROCESS_CATEGORIES: InProcessCategoryItem[] = [
  {
    id: 'cat-automation',
    name: 'Automation',
    code: 'PROC-AUTO',
    description: 'Robotic assembly, automated pick-and-place, vision alignment systems, high-speed SMT solder verification, and pneumatic torque control.',
    activeLines: 5,
    yieldRate: 99.4,
    sampleItems: [
      'High-Speed SMT Feed Verification',
      'Dual-Arm Robotic Screw Tightening (0.6 Nm)',
      'Inline Automated Optical Inspection (AOI)',
      'Pneumatic Pick-and-Place Feeder Indexing'
    ],
    inspectionStandard: 'IPC-A-610 Class 3 / ISO 9001:2015',
    lineStations: ['SMT Line 01 (Panasonic NPM)', 'Robotic Assembly Cell A4', 'Inline AOI Station 02', 'Laser Marking Cell'],
    tag: 'Robotics & Vision',
  },
  {
    id: 'cat-white-series',
    name: 'White Series',
    code: 'PROC-WHT',
    description: 'High-gloss white aesthetic faceplates, pure white switches, non-yellowing UV stabilized polymers, and specular gloss uniformity checks.',
    activeLines: 4,
    yieldRate: 98.7,
    sampleItems: [
      'Spectrophotometer Color Difference (ΔE < 0.35)',
      'Glossmeter 60° Angle Specular Reflectance',
      'UV Resistance & Anti-Yellowing Verification',
      'Silkscreen Alignment & Text Scratch Resistance'
    ],
    inspectionStandard: 'ASTM D2244 / ISO 2813 / DIN 5033',
    lineStations: ['Finishing Line W-1', 'Pad Printing & Curing Conveyor', 'Cleanroom Inspection Station 3', 'Packaging Feed Line'],
    tag: 'Aesthetic & Optical',
  },
  {
    id: 'cat-modular-nature',
    name: 'Modular/Nature',
    code: 'PROC-MOD',
    description: 'Modular grid framing, snap-fit interlocking tolerances, organic natural texture overlays, wood and stone effect acoustic switch assemblies.',
    activeLines: 3,
    yieldRate: 99.1,
    sampleItems: [
      'Snap-Fit Interlocking Retention Force (18N ± 2N)',
      'Natural Wood/Stone Grain Surface Texture Audit',
      'Modular Multi-Gang Alignment & Pitch Tolerance',
      'Interchangeable Bezel Clip Cycle Durability'
    ],
    inspectionStandard: 'IEC 60669-1 / ISO 1101 Geometric Tolerancing',
    lineStations: ['Modular Assembly Line M-02', 'Hydro-Dip Grain Finishing', 'Ultrasonic Bonding Cell 1', 'Sub-Assembly Grid Station'],
    tag: 'Mechanical & Finish',
  },
  {
    id: 'cat-led',
    name: 'LED',
    code: 'PROC-LED',
    description: 'In-line photometric goniometer testing, CCT chromaticity coordinate verification, luminous flux output, thermal pad bonding, and driver current regulation.',
    activeLines: 6,
    yieldRate: 99.6,
    sampleItems: [
      'Luminous Flux & Correlated Color Temp (CCT)',
      'Thermal Interface Material (TIM) Voiding < 5%',
      'Forward Voltage (Vf) & In-rush Current Ripple',
      'Reflow Profile Peak Temperature Compliance'
    ],
    inspectionStandard: 'IES LM-80 / IEC 62717 / CIE 127:2007',
    lineStations: ['High-Power LED Array Line 01', 'Integrating Sphere In-Line Chamber', 'Reflow Oven Zone 8', 'Burn-in Chamber 48h'],
    tag: 'Optoelectronics & Thermal',
  },
  {
    id: 'cat-injection-molding',
    name: 'Injection Molding',
    code: 'PROC-INJ',
    description: 'Multi-cavity mold dimension control, critical wall thickness, sink mark elimination, parting line flash trimming, and resin melt flow index audits.',
    activeLines: 8,
    yieldRate: 98.2,
    sampleItems: [
      'Critical Dimension Wall Thickness (2.40 ± 0.05 mm)',
      'Parting Line Flash Depth (< 0.02 mm)',
      'Gate Residual & Ejector Pin Mark Co-Planarity',
      'Resin Melt Temperature & Mold Cavity Pressure'
    ],
    inspectionStandard: 'DIN 16742 Class TG4 / ISO 294 / ASTM D955',
    lineStations: ['Engel 250T Injection Machine 04', 'Fanuc Roboshot All-Electric 150T', 'Automated CMM Quality Cell', 'Runner Separator Conveyor'],
    tag: 'Polymer Processing',
  },
];

export const SAMPLE_IN_PROCESS_CHECKPOINTS: InProcessSampleCheckpoint[] = [
  {
    id: 'chk-1',
    checkId: 'CHK-AUTO-9412',
    category: 'Automation',
    lineId: 'Line A1 - SMT 01',
    partName: 'Main Controller SMT Motherboard',
    station: 'Inline AOI Station 02',
    nominalSpec: 'Solder Paste Volume 100% ± 10%',
    measuredSpec: '102.4% (Pass)',
    status: 'pass',
    inspector: 'QA-8941',
    timestamp: '2026-09-09 14:20',
  },
  {
    id: 'chk-2',
    checkId: 'CHK-WHT-8821',
    category: 'White Series',
    lineId: 'Line W-1 - Faceplate',
    partName: 'Pure White 2-Gang Rocker Switch Bezel',
    station: 'Spectrophotometer Chamber',
    nominalSpec: 'Color Difference ΔE ≤ 0.50',
    measuredSpec: 'ΔE = 0.22 (Excellent)',
    status: 'pass',
    inspector: 'QA-8941',
    timestamp: '2026-09-09 13:45',
  },
  {
    id: 'chk-3',
    checkId: 'CHK-MOD-7719',
    category: 'Modular/Nature',
    lineId: 'Line M-02 - Grid Assembly',
    partName: 'Walnut Texture Snap-Fit Grid Module',
    station: 'Tensile Snap Gauge B',
    nominalSpec: 'Snap Retention Force 18.0 ± 2.0 N',
    measuredSpec: '18.4 N (Pass)',
    status: 'pass',
    inspector: 'QA-8941',
    timestamp: '2026-09-09 13:10',
  },
  {
    id: 'chk-4',
    checkId: 'CHK-LED-6502',
    category: 'LED',
    lineId: 'Line L-3 - COB Matrix',
    partName: '50W Daylight Linear LED Core',
    station: 'In-line Sphere Chamber',
    nominalSpec: 'CCT 4000K ± 150K / 5400 lm',
    measuredSpec: '4035K / 5460 lm (Pass)',
    status: 'pass',
    inspector: 'QA-8941',
    timestamp: '2026-09-09 12:35',
  },
  {
    id: 'chk-5',
    checkId: 'CHK-INJ-5491',
    category: 'Injection Molding',
    lineId: 'Machine 04 - Engel 250T',
    partName: 'Internal Terminal Housing Polycarbonate',
    station: 'Optical CMM Cell',
    nominalSpec: 'Wall Thickness 2.40 ± 0.05 mm',
    measuredSpec: '2.41 mm (Pass)',
    status: 'pass',
    inspector: 'QA-8941',
    timestamp: '2026-09-09 11:50',
  },
];
