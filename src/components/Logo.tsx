// src/components/Logo.js

import React from 'react';

export function Logo(props: React.ComponentPropsWithoutRef<'img'>) {
  return (
    <img 
      src="/images/image.png" 
      alt="Therapedia Logo" 
      className="h-8 w-auto" 
      {...props} 
    />
  );
}

