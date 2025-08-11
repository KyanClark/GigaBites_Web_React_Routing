import React from 'react'
import './Hero.css'

const Hero = ({ onAddProductClick, hasProducts }) => {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="brand-highlight">GigaBites</span> Store
            </h1>
            <p className="hero-subtitle">
              Premium tech products with cutting-edge innovation. 
              Manage your inventory and explore our curated collection.
            </p>
            <div className="hero-actions">
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="card-glow"></div>
              <div className="card-content">
                <div className="tech-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <h3>Premium Tech</h3>
                <p>Latest gadgets and accessories</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">10k+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Support</span>
          </div>
        </div>
      </div>
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </section>
  )
}

export default Hero
