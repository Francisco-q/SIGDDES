import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = true 
}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200';
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };
  const shadowClass = shadow ? 'shadow-sm hover:shadow-md transition-shadow' : '';
  
  return (
    <div className={`${baseClasses} ${paddingClasses[padding]} ${shadowClass} ${className}`}>
      {children}
    </div>
  );
};
