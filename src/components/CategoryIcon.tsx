import React from 'react';
import { RequestCategory } from '../types';
import {
  Lightbulb,
  Droplets,
  Trash2,
  Car,
  HeartPulse,
  Trees,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  category: RequestCategory;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = 'w-5 h-5' }) => {
  switch (category) {
    case 'Broken Streetlight':
      return <Lightbulb className={className} />;
    case 'Water & Sewage':
      return <Droplets className={className} />;
    case 'Garbage Collection':
      return <Trash2 className={className} />;
    case 'Road Pothole':
      return <Car className={className} />;
    case 'Public Health':
      return <HeartPulse className={className} />;
    case 'Parks & Green Spaces':
      return <Trees className={className} />;
    case 'Other':
    default:
      return <HelpCircle className={className} />;
  }
};
