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
