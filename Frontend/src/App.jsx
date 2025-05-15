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

// Import OtherUserProfile
import OtherUserProfile from './pages/OtherUserProfile.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('profile');
    return stored ? JSON.parse(stored) : null;
  });
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [token]);

  return (
    <Router>
      <div>
        <Header token={token} setToken={setToken} profile={profile} avatar={avatar} />

        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<FeedPage />} />
            <Route path="/feeds" element={<FeedPage />} />
            <Route path="/login" element={<LoginRegister setToken={setToken} profile={profile} setProfile={setProfile} setAvatar={setAvatar} />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<HelpSupport />} />

            {/* Other User Profile Route */}
            <Route path="/user/:public_id" element={<OtherUserProfileWrapper />} />

            {/* Protected Routes (Private) */}
            <Route path="/recipes" element={<PrivateRoute><NotFound /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile profile={profile} setProfile={setProfile} /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Wrapper component to extract username param and pass to OtherUserProfile
import { useParams } from 'react-router-dom';

function OtherUserProfileWrapper() {
  const { username } = useParams();
  return <OtherUserProfile username={username} />;
}

export default App;
