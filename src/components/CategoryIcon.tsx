import React from 'react';
import {
  Hammer,
  Trash2,
  FileText,
  HeartHandshake,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  Building,
  AlertTriangle,
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  className = 'w-4 h-4',
  size = 16,
}) => {
  switch (iconName?.toLowerCase()) {
    case 'hammer':
    case 'construction':
      return <Hammer size={size} className={className} />;
    case 'trash2':
    case 'leaf':
      return <Trash2 size={size} className={className} />;
    case 'filetext':
    case 'landmark':
      return <FileText size={size} className={className} />;
    case 'hearthandshake':
    case 'gift':
      return <HeartHandshake size={size} className={className} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck size={size} className={className} />;
    case 'lightbulb':
      return <Lightbulb size={size} className={className} />;
    case 'building':
      return <Building size={size} className={className} />;
    case 'alerttriangle':
      return <AlertTriangle size={size} className={className} />;
    default:
      return <HelpCircle size={size} className={className} />;
  }
};

