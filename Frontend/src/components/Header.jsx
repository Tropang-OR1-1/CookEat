import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CreatePost from "./CreatePost.jsx";
import LoginRegister from "./LoginRegister.jsx";
import "./styles/header.css";

function Header({ token, setToken }) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown toggle
  const navigate = useNavigate(); // Use navigate hook for redirection

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    setToken(null); // Clear token from state
    navigate("/login"); // Redirect to login page
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown on click
  };

  return (
    <header className="header-navbar header">
      <div className="header-logo-container">
        <Link to="/">
          <img src="./images/CookEat_Logo.png" alt="Cook It Logo" className="header-logo" />
        </Link>
      </div>

      <div className="header-search-container">
        <input type="text" placeholder="Search in CookEat" className="header-search-bar" />
      </div>

      <nav className="header-nav-links">
        <div className="header-center">
          <Link to="/" className="header-button">Feeds</Link>
          <Link to="/recipes" className="header-button">Recipes</Link>
          
          {/* Render "About Us" button only when the user is logged out */}
          {!token && (
            <Link to="/about" className="header-button">About Us</Link>
          )}

          {/* Links that appear only if the user is logged in */}
          {token && (
            <>
              <Link to="/notifications" className="header-button">Notifications</Link>
              <button className="header-button" onClick={() => setIsPostModalOpen(true)}>Create Post</button>
            </>
          )}
        </div>
        {/* Login/Register button only shown if not logged in */}
        {!token && (
          <button className="header-button" onClick={() => setIsLoginModalOpen(true)}>Login/Register</button>
        )}
      </nav>

      {/* Create Post Modal */}
      <CreatePost isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />

      {/* Login/Register Modal */}
      <LoginRegister 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        setToken={setToken}
      />

      {/* Profile dropdown only shown if logged in */}
      {token && (
        <div className="header-profile-dropdown">
          <img 
            src="/images/profile_img.jpg" 
            alt="User Profile" 
            className="header-profile-pic" 
            onClick={toggleDropdown} // Handle click to toggle dropdown
          />
          {isDropdownOpen && ( // Only show dropdown if it's open
            <div className="header-dropdown-content">
              <Link to="/profile">Show Profile</Link>
              <Link to="/help">Help and Support</Link>
              <Link to="/incentives">Incentives</Link>
              <Link to="/settings">Settings</Link>
              <Link to="/about">About Us</Link>
              <Link to="#" onClick={handleLogout}>Log Out</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
