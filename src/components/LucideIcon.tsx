import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface LucideIconProps extends LucideProps {
  name: string;
}

const LucideIcon: React.FC<LucideIconProps> = ({ name, ...props }) => {
  // Convert kebab-case (from CMS) to PascalCase (for Lucide components)
  // e.g., 'calendar-check' -> 'CalendarCheck'
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof LucideIcons;

  const IconComponent = LucideIcons[pascalName] as React.ElementType;

  if (!IconComponent) {
    // Fallback to Package if icon name is invalid
    return <LucideIcons.Package {...props} />;
  }

  return <IconComponent {...props} />;
};

export default LucideIcon;
