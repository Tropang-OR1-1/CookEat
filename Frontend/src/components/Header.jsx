import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || 'default-avatar.jpg');
  const [isSearchIconVisible, setIsSearchIconVisible] = useState(false);

  const addPostRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect from Version 1 for fetching profile via axios
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("https://cookeat.cookeat.space/user/profile/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data?.Profile?.picture) {
          const pictureUrl = `https://cookeat.cookeat.space/media/profile/${response.data.Profile.picture}`;
          setAvatar(pictureUrl);
          localStorage.setItem("avatar", pictureUrl);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  // useEffect from Version 1/2 for profile prop (if a parent component provides it)
  useEffect(() => {
    if (profile && profile.avatar) {
      setAvatar(profile.avatar);
    }
  }, [profile]);

  // useEffect from Version 1/2 for stored profile in localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      if (parsedProfile.avatar) {
        setAvatar(parsedProfile.avatar);
      }
    }
  }, []);

  // useEffect from Version 1/2 for click outside handling
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
    localStorage.removeItem("profile");
    localStorage.removeItem("public_id");
    localStorage.removeItem("avatar");
    setToken(null);
    window.location.href = "/feeds";
  };


  useEffect(() => {
    if (
      isPostModalOpen ||
      isRecipeModalOpen || 
      isLoginModalOpen || 
      isNotificationModalOpen || 
      isProfileDropdownOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto"; 
    };
  }, [
    isPostModalOpen, 
    isRecipeModalOpen, 
    isLoginModalOpen, 
    isNotificationModalOpen, 
    isProfileDropdownOpen,
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1200) {
        setIsSearchIconVisible(true);
      } else {
        setIsSearchIconVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); 

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        {/* Search bar visible on larger screens */}
        {!isSearchIconVisible && (
          <input
            type="text"
            placeholder="Search in CookEat"
            className="header-search-bar"
          />
        )}
        {/* Search icon visible on smaller screens */}
        {isSearchIconVisible && (
          <button className="header-button header-search-icon">
             <i className="bx bx-search"></i> {/* Using a Boxicon search icon */}
          </button>
        )}
      </div>

      <nav className="header-nav-links">
        <div className="header-center">
          <div className="header-tooltip-wrapper">
            <Link
              to="/feeds"
              className={`header-button ${location.pathname === "/" || location.pathname === "/feeds" ? "active" : ""}`}
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
            <>
              <div className="header-tooltip-wrapper">
                <Link
                  to="/about"
                  className={`header-button ${location.pathname === "/about" ? "active" : ""}`}
                >
                  <i className="bx bxl-dev-to"></i>
                  <span className="header-tooltip">About Us</span>
                </Link>
              </div>
              <div className="header-tooltip-wrapper">
                <Link
                  to="/help"
                  className={`header-button ${location.pathname === "/help" ? "active" : ""}`}
                >
                  <i className="bx bx-help-circle"></i>
                  <span className="header-tooltip">Help and Support</span>
                </Link>
              </div>
            </>
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
        setToken={(token) => {
          setToken(token);
          const stored = localStorage.getItem("profile");
          if (stored) {
            const profile = JSON.parse(stored);
            setAvatar(profile.avatar);
          }
        }}
        setAvatar={setAvatar}
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