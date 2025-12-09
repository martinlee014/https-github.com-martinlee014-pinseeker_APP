import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-black text-white flex flex-col font-sans ${className}`}>
      {children}
    </div>
  );
};

export default Layout;