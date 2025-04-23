import React, { useState } from "react";
import "./Header.css";
import CreatePost from "../createpost/CreatePost.jsx";
import LoginRegister from "../loginRegister/LoginRegister.jsx"; 

function Header() {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 

  return (
    <header className="header-navbar header">
      <div className="header-logo-container">
        <a href="/src/pages/home.html">
          <img src="/CookEat_Logo.png" alt="Cook It Logo" className="header-logo" />
        </a>
      </div>

      <div className="header-search-container">
        <input type="text" placeholder="Search for recipes..." className="header-search-bar" />
      </div>

      <nav className="header-nav-links">
        <a href="/src/pages/home.html" className="header-button">Home</a>
        <a href="/src/pages/recipes.html" className="header-button">Recipes</a>
        <a href="/src/pages/about.html" className="header-button">About Us</a>
        <a href="/src/pages/home.html" className="header-button">Feeds</a>
        <a href="#" className="header-button">Reels & Videos</a>
        <a href="#" className="header-button">Notifications</a>
        <button className="header-button" onClick={() => setIsPostModalOpen(true)}>Create Post</button>

        {/* ✅ Login/Register Modal (THIS IS ONLY TEMPORARY, WE NEED A CONDITIONAL STATEMENT FOR App.jsx IF THE USER IS LOGGED IN OR NOT) */}
        <button className="header-button" onClick={() => setIsLoginModalOpen(true)}>Login</button>
      </nav>

      {/* ✅ Create Post Modal */}
      <CreatePost isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />

      {/* ✅ Login/Register Modal (THIS IS ONLY TEMPORARY, WE NEED A CONDITIONAL STATEMENT FOR App.jsx IF THE USER IS LOGGED IN OR NOT) */}
      <LoginRegister isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    
      <div class="header-profile-dropdown">
        <img src="/images/profile_img.jpg" alt="User Profile" class="header-profile-pic" />
        <div class="header-dropdown-content">
          <a href="/src/pages/profile.html">Show Profile</a>
          <a href="#">Help and Support</a>
          <a href="#">Incentives</a>
          <a href="/src/pages/settings.html">Settings</a>
          <a href="/src/pages/about.html">About Us</a>
          <a href="#">Log Out</a>
        </div>
      </div>
    </header>
  )
}

export default Header