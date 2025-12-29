import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: 'GB' },
    { code: 'pt', name: 'Português', flag: 'BR' },
    { code: 'de', name: 'Deutsch', flag: 'DE' },
    { code: 'da', name: 'Dansk', flag: 'DK' },
    { code: 'ja', name: '日本語', flag: 'JP' },
    { code: 'zh', name: '中文', flag: 'CN' },
    { code: 'es', name: 'Español', flag: 'ES' },
    { code: 'fr', name: 'Français', flag: 'FR' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div>
      <select 
        value={i18n.language} 
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #BDC3C7',
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;