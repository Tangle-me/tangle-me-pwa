import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LandingPage.css';

function LandingPage() {
  const { t } = useTranslation();
  const [showTestModal, setShowTestModal] = useState(false);

  const handleTestClick = () => {
    setShowTestModal(true);
  };

  const closeModal = () => {
    setShowTestModal(false);
  };

  const dummyListings = [
    {
      id: 1,
      title: "Embraer E195-E2 Aircraft",
      location: "São Paulo, Brasil",
      price: "$62,500,000",
      description: "Brand new Embraer E195-E2 commercial aircraft. Seating for 146 passengers. Latest technology and fuel efficiency.",
      category: "Aviation"
    },
    {
      id: 2,
      title: "Vintage BMW Motorcycle",
      location: "Munich, Germany",
      price: "€8,500",
      description: "Classic 1975 BMW R90S motorcycle in excellent condition. Recently restored with original parts.",
      category: "Vehicles"
    },
    {
      id: 3,
      title: "Beachfront Villa",
      location: "Cape Town, South Africa",
      price: "R12,500,000",
      description: "Luxury 5-bedroom beachfront villa with stunning ocean views. Modern amenities and private beach access.",
      category: "Real Estate"
    },
    {
      id: 4,
      title: "Professional Camera Kit",
      location: "Tokyo, Japan",
      price: "¥450,000",
      description: "Canon EOS R5 with 3 professional lenses, gimbal, and accessories. Perfect for professional photographers.",
      category: "Electronics"
    },
    {
      id: 5,
      title: "Antique Furniture Set",
      location: "Copenhagen, Denmark",
      price: "kr 25,000",
      description: "Beautiful 19th century Danish furniture set including table, chairs, and cabinet. Excellent condition.",
      category: "Furniture"
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-left">
          <button className="test-btn" onClick={handleTestClick} title={t('dummyListings')}>
            <img 
              src="/tangle-me-logo.svg" 
              alt="Tangle-me" 
              className="test-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="test-text">{t('testDemo')}</span>
          </button>
        </div>
        
        <div className="header-right">
          <LanguageSwitcher />
          <button className="btn-login">{t('login')}</button>
          <button className="btn-signup">{t('signup')}</button>
          <button className="btn-about">{t('about')}</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        {/* Brand Section */}
        <div className="brand-section">
          <img 
            src="/tangle-me-logo-original.png" 
            alt="Tangle-me" 
            className="brand-logo-original"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        <div className="features-container">
          {/* Feature 1: Post Free */}
          <button className="feature-btn feature-btn-primary">
            <div className="feature-btn-icon post-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="feature-btn-content">
              <h2 className="feature-btn-title">{t('postFree')}</h2>
              <p className="feature-btn-desc">{t('postFreeDesc')}</p>
            </div>
          </button>

          {/* Feature 2: Find */}
          <button className="feature-btn feature-btn-secondary">
            <div className="feature-btn-icon find-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="feature-btn-content">
              <h2 className="feature-btn-title">{t('find')}</h2>
              <p className="feature-btn-desc">{t('findDesc')}</p>
            </div>
          </button>

          {/* Feature 3: My Tangles */}
          <button className="feature-btn feature-btn-secondary feature-btn-branded">
            <div className="feature-btn-icon tangles-icon">
              <img 
                src="/tangle-me-logo.svg" 
                alt="Tangle-me" 
                className="feature-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="feature-btn-content">
              <h2 className="feature-btn-title">{t('myTangles')}</h2>
              <p className="feature-btn-desc">{t('myTanglesDesc')}</p>
            </div>
          </button>
        </div>

        {/* CTA Button */}
        <div className="cta-section">
          <button className="btn-cta">{t('signupFree')}</button>
        </div>
      </main>

      {/* Test Modal */}
      {showTestModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2 className="modal-title">{t('dummyListings')}</h2>
            
            <div className="listings-grid">
              {dummyListings.map((listing) => (
                <div key={listing.id} className="listing-card">
                  <div className="listing-header">
                    <h3 className="listing-title">{listing.title}</h3>
                    <span className="listing-category">{listing.category}</span>
                  </div>
                  <div className="listing-location">📍 {listing.location}</div>
                  <p className="listing-description">{listing.description}</p>
                  <div className="listing-footer">
                    <div className="listing-price">{listing.price}</div>
                    <div className="listing-actions">
                      <button className="btn-action" title={t('contact')}>
                        💬
                      </button>
                      <button className="btn-action" title={t('share')}>
                        📤
                      </button>
                      <button className="btn-action" title={t('save')}>
                        ⭐
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;