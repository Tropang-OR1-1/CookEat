import React, { useState } from "react";
import { Link } from "react-router-dom";
import CreatePost from "../createpost/CreatePost.jsx";
import LoginRegister from "../loginRegister/LoginRegister.jsx";
import "./Header.css";

function Header() {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <header className="header-navbar header">
      <div className="header-logo-container">
        <Link to="/">
          <img src="/images/CookEat_Logo.png" alt="Cook It Logo" className="header-logo" />
        </Link>
      </div>

      <div className="header-search-container">
        <input type="text" placeholder="Search for recipes..." className="header-search-bar" />
      </div>

      <nav className="header-nav-links">
        <Link to="/" className="header-button">Home</Link>
        <Link to="/recipes" className="header-button">Recipes</Link>
        <Link to="/" className="header-button">Feeds</Link>
        <Link to="/reels" className="header-button">Reels & Videos</Link>
        <Link to="/notifications" className="header-button">Notifications</Link>
        <button className="header-button" onClick={() => setIsPostModalOpen(true)}>Create Post</button>

        {/* ✅ Login/Register Modal (THIS IS ONLY TEMPORARY, WE NEED A CONDITIONAL STATEMENT FOR App.jsx IF THE USER IS LOGGED IN OR NOT) */}
        <button className="header-button" onClick={() => setIsLoginModalOpen(true)}>Login</button>
      </nav>

      {/* ✅ Create Post Modal */}
      <CreatePost isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />

      {/* ✅ Login/Register Modal (THIS IS ONLY TEMPORARY, WE NEED A CONDITIONAL STATEMENT FOR App.jsx IF THE USER IS LOGGED IN OR NOT) */}
      <LoginRegister isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    
      <div className="header-profile-dropdown header-dropdown">
        <img src="/images/profile_img.jpg" alt="User Profile" className="header-profile-pic" />
        <div className="header-dropdown-content">
          <Link to="/profile">Show Profile</Link>
          <Link to="/help">Help and Support</Link>
          <Link to="/incentives">Incentives</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/about">About Us</Link>
          <Link to="/logout">Log Out</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
