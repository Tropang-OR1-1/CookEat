import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LoginRegister from './components/LoginRegister.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import About from './pages/About.jsx';
import FeedPage from './pages/FeedPage.jsx';
import NotFound from './pages/NotFound.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import HelpSupport from './pages/HelpSupport.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('profile');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    // Update token state when token changes
    setToken(localStorage.getItem('token'));
  }, [token]);

  return (
    <Router>
      <div>
        <Header token={token} setToken={setToken} profile={profile} /> 

        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/feeds" replace />} />
            <Route path="/login" element={<LoginRegister setToken={setToken} setProfile={setProfile} />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<HelpSupport />} />

            {/* Protected Routes (Private) */}
            <Route path="/feeds" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile profile={profile} setProfile={setProfile} /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* Catch-all Route for Undefined Paths (404) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
