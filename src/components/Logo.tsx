// src/components/Logo.js

import React from 'react';

export function Logo(props: React.ComponentPropsWithoutRef<'img'>) {
  return (
    <img src="image.png" alt="Therapeida Logo" {...props} />
  );
}