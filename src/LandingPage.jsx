import React, { useEffect } from 'react';
import heroImage from './assets/pavilion.png';

export default function LandingPage() {
  
  // Clean up global body styles for the landing page route
  // The global 'overflow: hidden' is needed for the 3D canvas but breaks landing page scrolling
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F7F4EE',
      fontFamily: '"Inter", sans-serif',
      color: '#1B2430'
    }}>
      {/* 1. HERO SECTION */}
      <section style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '24px'
      }}>
        <div style={{
          fontFamily: '"Fraunces", serif',
          fontSize: '24px',
          fontWeight: 700,
          color: '#B08D57',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '20px'
        }}>
          Sightline
        </div>
        
        <h1 style={{
          fontFamily: '"Fraunces", serif',
          fontSize: 'clamp(32px, 8vw, 64px)',
          fontWeight: 600,
          lineHeight: 1.1,
          margin: 0,
          color: '#1B2430',
          maxWidth: '800px',
          width: '100%'
        }}>
          See your seat before you book it.
        </h1>
        
        <p style={{
          fontSize: 'clamp(16px, 4vw, 22px)',
          lineHeight: 1.5,
          color: '#4A5568',
          maxWidth: '600px',
          margin: '0 0 16px 0',
          width: '100%'
        }}>
          Stop guessing from flat charts. Explore the venue, check the exact sightlines, and buy with total confidence.
        </p>

        <a 
          href="#experience"
          style={{
            display: 'inline-block',
            backgroundColor: '#1B2430',
            color: '#F7F4EE',
            textDecoration: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(27, 36, 48, 0.15)',
            marginBottom: '40px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3b4e';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1B2430';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Launch the Experience
        </a>

        {/* Hero Visual */}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          maxHeight: '600px',
          backgroundColor: '#E8E4DA',
          borderRadius: '16px',
          border: '1px solid rgba(176, 141, 87, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(27, 36, 48, 0.08)',
          position: 'relative'
        }}>
          <img src={heroImage} alt="Venue Overview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section style={{
        padding: '80px 24px',
        backgroundColor: '#1B2430',
        color: '#F7F4EE',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: '"Fraunces", serif',
            fontSize: '32px',
            fontWeight: 600,
            marginBottom: '24px',
            color: '#E8E4DA'
          }}>
            Flat charts hide the truth.
          </h2>
          <p style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#A0AABF'
          }}>
            Standard 2D seating maps leave you guessing about depth, scale, and sightlines. You shouldn't have to wait until the day of the event to discover a structural pillar is blocking half the stage.
          </p>
        </div>
      </section>

      {/* 3. THE SOLUTION */}
      <section style={{
        padding: '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontFamily: '"Fraunces", serif',
            fontSize: '36px',
            fontWeight: 600,
            color: '#1B2430',
            marginBottom: '16px'
          }}>
            A better way to choose.
          </h2>
          <p style={{ fontSize: '18px', color: '#4A5568', maxWidth: '600px', margin: '0 auto' }}>
            Sightline builds a precise 3D digital twin of the venue, letting you virtually sit in any seat before making a decision.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px'
        }}>
          {/* Feature Card 1 */}
          <div style={{
            backgroundColor: '#F7F4EE',
            border: '1px solid rgba(176, 141, 87, 0.25)',
            borderRadius: '12px',
            padding: '40px 32px',
            boxShadow: '0 4px 12px rgba(27, 36, 48, 0.03)',
            transition: 'transform 0.2s ease'
          }}>
            <div style={{ color: '#B08D57', marginBottom: '20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <h3 style={{ fontFamily: '"Fraunces", serif', fontSize: '22px', fontWeight: 600, marginBottom: '12px', color: '#1B2430' }}>
              Full Venue Exploration
            </h3>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#4A5568', margin: 0 }}>
              Orbit the venue, inspect the layout, and understand exactly where every section is located relative to the stage.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div style={{
            backgroundColor: '#F7F4EE',
            border: '1px solid rgba(176, 141, 87, 0.25)',
            borderRadius: '12px',
            padding: '40px 32px',
            boxShadow: '0 4px 12px rgba(27, 36, 48, 0.03)'
          }}>
            <div style={{ color: '#B08D57', marginBottom: '20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h3 style={{ fontFamily: '"Fraunces", serif', fontSize: '22px', fontWeight: 600, marginBottom: '12px', color: '#1B2430' }}>
              See Your Exact View
            </h3>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#4A5568', margin: 0 }}>
              Swoop directly into any available seat and see the perspective exactly as you will on the day of the event.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div style={{
            backgroundColor: '#F7F4EE',
            border: '1px solid rgba(176, 141, 87, 0.25)',
            borderRadius: '12px',
            padding: '40px 32px',
            boxShadow: '0 4px 12px rgba(27, 36, 48, 0.03)'
          }}>
            <div style={{ color: '#B08D57', marginBottom: '20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 style={{ fontFamily: '"Fraunces", serif', fontSize: '22px', fontWeight: 600, marginBottom: '12px', color: '#1B2430' }}>
              Obstruction Awareness
            </h3>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#4A5568', margin: 0 }}>
              Honest data. We mathematically calculate sightline blockages from pillars or speakers, so you're never surprised.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CASE STUDY */}
      <section style={{
        backgroundColor: '#E8E4DA',
        padding: '100px 24px',
        borderTop: '1px solid rgba(176, 141, 87, 0.15)',
        borderBottom: '1px solid rgba(176, 141, 87, 0.15)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '64px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#6E2A34', fontWeight: 600, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Case Study
            </div>
            <h2 style={{
              fontFamily: '"Fraunces", serif',
              fontSize: '32px',
              fontWeight: 600,
              color: '#1B2430',
              marginBottom: '24px',
              lineHeight: 1.2
            }}>
              The difference between guessing and knowing.
            </h2>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#4A5568', marginBottom: '24px', marginTop: 0 }}>
              The Aso Pavilion is a beautiful venue, but its architecture includes two structural pillars and a strategically positioned speaker that create real sightline obstructions.
            </p>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#4A5568', marginBottom: '32px', marginTop: 0 }}>
              A flat chart would simply sell you a seat behind a pillar. Sightline uses a proprietary raycasting model to calculate the exact percentage of the stage blocked from every single chair, dynamically flagging seats with <strong style={{ color: '#1B2430' }}>Partial View</strong> or <strong style={{ color: '#1B2430' }}>Heavy Obstruction</strong> warnings.
            </p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#A19E98' }}></span>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#1B2430' }}>Clear View (0 - 15% blocked)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffb366' }}></span>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#1B2430' }}>Partial View (15% - 40% blocked)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff4d4d' }}></span>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#1B2430' }}>Heavy Obstruction (40%+ blocked)</span>
              </li>
            </ul>
          </div>
          
          {/* Obstruction Visual */}
          <div style={{
            width: '100%',
            aspectRatio: '4/3',
            backgroundColor: '#F7F4EE',
            borderRadius: '16px',
            border: '1px solid rgba(176, 141, 87, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 24px 48px rgba(110, 42, 52, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <img src={heroImage} alt="Venue Obstruction View" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Mock UI Overlay to make it look intentional */}
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(110, 42, 52, 0.85)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
              border: '1px solid #ff4d4d'
            }}>
              ⚠️ Heavy Obstruction
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section style={{
        padding: '100px 24px',
        textAlign: 'center',
        backgroundColor: '#F7F4EE'
      }}>
        <h2 style={{
          fontFamily: '"Fraunces", serif',
          fontSize: '36px',
          fontWeight: 600,
          color: '#1B2430',
          marginBottom: '32px'
        }}>
          Ready to look around?
        </h2>
        <a 
          href="#experience"
          style={{
            display: 'inline-block',
            backgroundColor: '#1B2430',
            color: '#F7F4EE',
            textDecoration: 'none',
            padding: '16px 40px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(27, 36, 48, 0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3b4e';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1B2430';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Launch the Experience
        </a>
      </section>

      {/* 6. FOOTER */}
      <footer style={{
        backgroundColor: '#1B2430',
        color: '#A0AABF',
        padding: '32px 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(176, 141, 87, 0.2)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            fontFamily: '"Fraunces", serif',
            fontSize: '20px',
            fontWeight: 600,
            color: '#B08D57',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Sightline
          </div>
          <p style={{ fontSize: '14px', margin: 0 }}>
            © {new Date().getFullYear()} Sightline Venue Experiences. All rights reserved.
          </p>
          <p style={{ fontSize: '13px', margin: 0, color: '#8A95A5' }}>
            Designed and built by Ceejay Ginger — Helioconvrt.{' '}
            <a 
              href="https://helioconvrt.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#B08D57', textDecoration: 'underline' }}
            >
              helioconvrt.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
