
import React from 'react';

interface BigButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  ariaLabel?: string;
  className?: string;
  // Fix: Added disabled prop to the interface
  disabled?: boolean;
}

const BigButton: React.FC<BigButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  ariaLabel, 
  className = '',
  disabled 
}) => {
  const baseStyles = "w-full py-6 px-4 rounded-3xl text-xl font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center text-center leading-tight min-h-[80px]";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
    outline: "bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300"
  };

  // Fix: Added styling for disabled state
  const disabledStyles = "opacity-50 cursor-not-allowed active:scale-100 pointer-events-none grayscale-[0.5]";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      // Fix: Apply the disabled attribute to the HTML button element
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? disabledStyles : ''}`}
    >
      {children}
    </button>
  );
};

export default BigButton;
