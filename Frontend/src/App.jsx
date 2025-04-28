import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/header/Header.jsx';
import Profile from './pages/profile/Profile.jsx';
import Settings from './pages/settings/Settings.jsx';
import About from './pages/about/About.jsx';
import FeedPage from './pages/feedpage/FeedPage.jsx';
import LoginRegister from './components/loginRegister/LoginRegister.jsx';
import PrivateRoute from './components/privateRoute/PrivateRoute.jsx';


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
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginRegister setToken={setToken} />} />
            <Route path="/about" element={<About />} />

            {/* Protected Routes (Private) */}
            <Route path="/feeds" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div>
      <h1>Welcome to CookEat</h1>
      <p>Explore delicious recipes and more!</p>
    </div>
  );
}

export default App;
