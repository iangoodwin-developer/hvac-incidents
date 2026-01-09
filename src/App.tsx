// App shell that hosts the router and shared styling.
// The router itself is hash-based to avoid extra dependencies.

import React from 'react';
import './App.scss';
import { AppRouter } from './logicalComponents/AppRouter';

export function App() {
  return (
    <div className='app'>
      <AppRouter />
    </div>
  );
}
