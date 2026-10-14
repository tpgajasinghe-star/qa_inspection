import React from 'react';
import {
  Box,
  ClipboardCheck,
  Building2,
  Layers,
  Zap,
  Fan,
  ShieldCheck,
  Cpu,
  PackageCheck,
  Package,
  Boxes,
  Bot,
  Sparkles,
  Factory,
  Activity,
  Truck,
  CheckCircle2,
  Sliders,
  Wrench,
  Gauge,
  SlidersHorizontal,
  Eye,
  Scale,
  Microscope,
  Flame,
  HardHat,
  Search,
  Radio,
  FileCheck
} from 'lucide-react';

export interface AvailableIconOption {
  name: string;
  label: string;
  category: 'Module' | 'Components' | 'Quality & Lab' | 'Hardware & Factory';
}

export const AVAILABLE_CARD_ICONS: AvailableIconOption[] = [
  { name: 'Box', label: 'Box / Package', category: 'Module' },
  { name: 'ClipboardCheck', label: 'Clipboard Audit', category: 'Module' },
  { name: 'Building2', label: 'Plant / Facility', category: 'Module' },
  { name: 'Sliders', label: 'Sliders / Control', category: 'Module' },
  { name: 'Layers', label: 'Layers / Materials', category: 'Components' },
  { name: 'Zap', label: 'Electric / LED', category: 'Components' },
  { name: 'Fan', label: 'Thermal / Fan', category: 'Components' },
  { name: 'ShieldCheck', label: 'Protection Guard', category: 'Quality & Lab' },
  { name: 'Cpu', label: 'Electronic / SMT', category: 'Components' },
  { name: 'PackageCheck', label: 'Finished Goods', category: 'Module' },
  { name: 'Package', label: 'Carton Packing', category: 'Components' },
  { name: 'Boxes', label: 'Bulk Storage', category: 'Components' },
  { name: 'Bot', label: 'Robotics / Automation', category: 'Hardware & Factory' },
  { name: 'Sparkles', label: 'Aesthetic / Gloss', category: 'Quality & Lab' },
  { name: 'Factory', label: 'Molding / Press', category: 'Hardware & Factory' },
  { name: 'Activity', label: 'Diagnostics / Wave', category: 'Quality & Lab' },
  { name: 'Truck', label: 'Logistics / Supply', category: 'Hardware & Factory' },
  { name: 'Gauge', label: 'Tension / Metrology', category: 'Quality & Lab' },
  { name: 'Microscope', label: 'Micro Inspection', category: 'Quality & Lab' },
  { name: 'Scale', label: 'Precision Weight', category: 'Quality & Lab' },
  { name: 'Wrench', label: 'Tooling / Maintenance', category: 'Hardware & Factory' },
  { name: 'HardHat', label: 'Safety Engineering', category: 'Hardware & Factory' },
  { name: 'Eye', label: 'Optical Vision', category: 'Quality & Lab' },
  { name: 'Flame', label: 'Glow Wire / Flammability', category: 'Quality & Lab' },
  { name: 'Radio', label: 'RF / Wireless Sensor', category: 'Components' },
  { name: 'FileCheck', label: 'Certified Standard', category: 'Module' }
];

interface InspectionCardIconRendererProps {
  iconName: string;
  className?: string;
}

export const InspectionCardIconRenderer: React.FC<InspectionCardIconRendererProps> = ({
  iconName,
  className = 'w-6 h-6'
}) => {
  switch (iconName) {
    case 'Box':
      return <Box className={className} />;
    case 'ClipboardCheck':
      return <ClipboardCheck className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Sliders':
      return <Sliders className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Fan':
      return <Fan className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'PackageCheck':
      return <PackageCheck className={className} />;
    case 'Package':
      return <Package className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Factory':
      return <Factory className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'Gauge':
      return <Gauge className={className} />;
    case 'Microscope':
      return <Microscope className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'HardHat':
      return <HardHat className={className} />;
    case 'Eye':
      return <Eye className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Radio':
      return <Radio className={className} />;
    case 'FileCheck':
      return <FileCheck className={className} />;
    default:
      return <CheckCircle2 className={className} />;
  }
};
