import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header/Header.jsx';
import Profile from './pages/profile/Profile.jsx';
import Settings from './pages/settings/Settings.jsx';
import About from './pages/about/About.jsx';
import FeedPage from './pages/feedpage/FeedPage';  // Import FeedPage

import { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // When app loads, check if user already has a token
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return (
    <Router>
      <Header token={token} setToken={setToken} /> {/* Pass token and setToken to Header */}
      
      <Routes>
        <Route path="/profile" element={<Profile token={token} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="/feed" element={<FeedPage />} /> {/* Add route for FeedPage */}
      </Routes>
    </Router>
  );
}

export default App;
  