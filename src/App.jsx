import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LandingPage from './pages/LandingPage';
import './i18n';

function App() {
  const { i18n } = useTranslation();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage key={i18n.language} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;