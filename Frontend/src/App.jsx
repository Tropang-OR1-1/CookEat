import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header/Header.jsx';
import Profile from './pages/profile/Profile.jsx';
import Settings from './pages/settings/Settings.jsx';
import About from './pages/about/About.jsx';


function App() {

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/profile" element={ <Profile /> } />
        <Route path="/settings" element={ <Settings /> } />
        <Route path="/about" element={ <About /> } />
      </Routes>
    </Router>
  )
}

export default App
