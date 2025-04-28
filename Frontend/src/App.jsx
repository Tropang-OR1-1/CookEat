import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/header/Header.jsx';
import Profile from './pages/profile/Profile.jsx';
import Settings from './pages/settings/Settings.jsx';
import About from './pages/about/About.jsx';
import FeedPage from './pages/feedpage/FeedPage.jsx';
import LoginRegister from './components/loginRegister/LoginRegister.jsx';
import PrivateRoute from './components/privateRoute/PrivateRoute.jsx';
import NotFound from './pages/notFound/NotFound.jsx'; // Import 404 page

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Update token state when token changes
    setToken(localStorage.getItem('token'));
  }, [token]);

  return (
    <Router>
      <div>
        <Header token={token} setToken={setToken} />

        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/" />} /> {/* Redirect to /feeds */}

            <Route path="/login" element={<LoginRegister setToken={setToken} />} />
            <Route path="/about" element={<About />} />

            {/* Protected Routes (Private) */}
            <Route path="/feeds" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Catch-all Route for Undefined Paths (404) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
