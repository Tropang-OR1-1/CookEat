import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CreatePost from "./CreatePost.jsx";
import LoginRegister from "./LoginRegister.jsx";
import "./styles/header.css";

function Header({ token, setToken, profile }) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatar, setAvatar] = useState('/images/profile_img.jpg');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Reference for the dropdown
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    if (profile && profile.avatar) {
      setAvatar(profile.avatar);
    }
  }, [profile]);  // Respond to changes in profile

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      if (parsed.avatar) {
        setAvatar(parsed.avatar);
      }
    }
  }, []);

  useEffect(() => {
    // Close dropdown if clicked outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          <div className="header-tooltip-wrapper">
            <Link
              to="/"
              className={`header-button ${location.pathname === "/" ? "active" : ""}`}
            >
              <i className="bx bx-news"></i>
              <span className="header-tooltip">Feeds</span>
            </Link>
          </div>

          <div className="header-tooltip-wrapper">
            <Link
              to="/recipes"
              className={`header-button ${location.pathname === "/recipes" ? "active" : ""}`}
            >
              <i className="bx bx-food-menu"></i>
              <span className="header-tooltip">Recipes</span>
            </Link>
          </div>

          {token && (
            <div className="header-tooltip-wrapper">
              <button
                className="header-button"
                onClick={() => setIsPostModalOpen(true)}
              >
                <i className="bx bx-message-square-add"></i>
                <span className="header-tooltip">Create Post</span>
              </button>
            </div>
          )}

          {!token && (
            <div className="header-tooltip-wrapper">
              <Link
                to="/about"
                className={`header-button ${location.pathname === "/about" ? "active" : ""}`}
              >
                <i className="bx bxl-dev-to"></i>
                <span className="header-tooltip">About Us</span>
              </Link>
            </div>
          )}
        </div>

        {!token && (
          <div className="header-tooltip-wrapper header-button">
            <button className="header-button" onClick={() => setIsLoginModalOpen(true)}>
              <span className="header-login-text">Login</span>
              <span className="header-tooltip">Login / Register</span>
            </button>
          </div>
        )}
      </nav>

      <CreatePost isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
      <LoginRegister isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} setToken={setToken} />

      {token && (
        <div className="header-user-actions">
          <div className="header-tooltip-wrapper">
            <Link
              to="/notifications"
              className={`header-button ${location.pathname === "/notifications" ? "active" : ""}`}
            >
              <i className="bx bx-bell"></i>
              <span className="header-tooltip">Notifications</span>
            </Link>
          </div>
          <div className="header-profile-dropdown" ref={dropdownRef}>
            <img
              src={avatar}
              alt="User Profile"
              className="header-profile-pic"
              onClick={toggleDropdown}
            />
            <div className={`header-dropdown-content ${isDropdownOpen ? "open" : ""}`}>
              <Link to="/profile">Show Profile</Link>
              <Link to="/help">Help and Support</Link>
              <Link to="/incentives">Incentives</Link>
              <Link to="/settings">Settings</Link>
              <Link to="/about">About Us</Link>
              <Link to="#" onClick={handleLogout}>Log Out</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
      