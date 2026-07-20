import React, { useState, useEffect } from 'react';
import VenueScene from './VenueScene';
import LandingPage from './LandingPage';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentHash === '#experience') {
    return <VenueScene />;
  }

  return <LandingPage />;
}

export default App;
