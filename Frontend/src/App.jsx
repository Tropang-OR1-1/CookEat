import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import LoginRegister from './components/LoginRegister.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import About from './pages/About.jsx';
import FeedPage from './pages/FeedPage.jsx';
import NotFound from './pages/NotFound.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import HelpSupport from './pages/HelpSupport.jsx';
import OtherUserProfile from './pages/OtherUserProfile.jsx';

import { AuthProvider } from './contexts/AuthProvider.jsx';
import { UserProfileProvider } from './contexts/UserProfileContext.jsx';

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <Router>
          <div>
            <Header />

            <main>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<FeedPage />} />
                <Route path="/feeds" element={<FeedPage />} />
                <Route path="/login" element={<LoginRegister />} />
                <Route path="/about" element={<About />} />
                <Route path="/help" element={<HelpSupport />} />

                {/* Other User Profile Route */}
                <Route path="/user/:username" element={<OtherUserProfileWrapper />} />

                {/* Protected Routes */}
                <Route path="/recipes" element={<PrivateRoute><NotFound /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </UserProfileProvider>
    </AuthProvider>
  );
}

// Wrapper component to extract username param and pass to OtherUserProfile
import { useParams } from 'react-router-dom';

function OtherUserProfileWrapper() {
  const { username } = useParams();
  return <OtherUserProfile username={username} />;
}

export default App;
