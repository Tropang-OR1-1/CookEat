import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CreatePost from "./CreatePost.jsx";
import CreateRecipe from "./CreateRecipe.jsx";
import LoginRegister from "./LoginRegister.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import Notification from "./Notification.jsx";
import "./styles/header.css";

function Header({ token, setToken, profile }) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [avatar, setAvatar] = useState('/images/profile_img.jpg');

  const addPostRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profile && profile.avatar) {
      setAvatar(profile.avatar);
    }
  }, [profile]);

  useEffect(() => {
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      if (parsed.avatar) {
        setAvatar(parsed.avatar);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        addPostRef.current &&
        !addPostRef.current.contains(event.target)
      ) {
        setIsAddPostOpen(false);
      }

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  return (
    <header className="header-navbar header">
      <div className="header-logo-container">
        <Link to="/">
          <img
            src="./images/CookEat_Logo.png"
            alt="Cook It Logo"
            className="header-logo"
          />
        </Link>
      </div>

      <div className="header-search-container">
        <input
          type="text"
          placeholder="Search in CookEat"
          className="header-search-bar"
        />
      </div>

      <nav className="header-nav-links">
        <div className="header-center">
          <div className="header-tooltip-wrapper">
            <Link
              to="/feeds"
              className={`header-button ${location.pathname === "/" ? "active" : ""}`}
            >
              <i className="bx bx-news"></i>
              <span className="header-tooltip">Feeds</span>
            </Link>
          </div>

          {token && (
            <div className="header-tooltip-wrapper header-add-post-dropdown" ref={addPostRef}>
              <button
                className="header-button"
                onClick={() => {
                  setIsAddPostOpen((prev) => !prev);
                  setIsProfileDropdownOpen(false);
                }}
              >
                <i className="bx bx-plus-circle"></i>
                <span className="header-tooltip">Add Post</span>
              </button>

              {isAddPostOpen && (
                <div className="header-add-post-menu">
                  <button
                    onClick={() => {
                      setIsPostModalOpen(true);
                      setIsAddPostOpen(false);
                    }}
                  >
                    Create Post
                  </button>
                  <button
                    onClick={() => {
                      setIsRecipeModalOpen(true);
                      setIsAddPostOpen(false);
                    }}
                  >
                    Create Recipe
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="header-tooltip-wrapper">
            <Link
              to="/recipes"
              className={`header-button ${location.pathname === "/recipes" ? "active" : ""}`}
            >
              <i className="bx bx-food-menu"></i>
              <span className="header-tooltip">Recipes</span>
            </Link>
          </div>

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
      <ErrorBoundary>
        <CreateRecipe isOpen={isRecipeModalOpen} onClose={() => setIsRecipeModalOpen(false)} />
      </ErrorBoundary>
      <LoginRegister
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        setToken={setToken}
      />

      {token && (
        <div className="header-user-actions">
          <div className="header-tooltip-wrapper">
            <button
              className="header-button"
              onClick={() => setIsNotificationModalOpen(true)}
            >
              <i className="bx bx-bell"></i>
              <span className="header-tooltip">Notifications</span>
            </button>
          </div>

          <div className="header-profile-dropdown" ref={profileDropdownRef}>
            <img
              src={avatar}
              alt="User Profile"
              className="header-profile-pic"
              onClick={() => {
                setIsProfileDropdownOpen((prev) => !prev);
                setIsAddPostOpen(false);
              }}
            />
            <div className={`header-dropdown-content ${isProfileDropdownOpen ? "open" : ""}`}>
              <Link to="/profile">Show Profile</Link>
              <Link to="/help">Help and Support</Link>
              <Link to="/incentives">Incentives</Link>
              <Link to="/settings">Settings</Link>
              <Link to="/about">About Us</Link>
              <Link to="#" onClick={handleLogout}>
                Log Out
              </Link>
            </div>
          </div>

          <Notification isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} />
        </div>
      )}
    </header>
  );
}

export default Header;
