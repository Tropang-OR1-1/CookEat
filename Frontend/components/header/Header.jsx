import React from "react";
import "./Header.css";

function Header() {
  return (
    <header class="header-navbar header">
      <div class="header-logo-container">
        <a href="/src/pages/home.html">
          <img src="/CookEat_Logo.png" alt="Cook It Logo" class="header-logo" />
        </a>
      </div>
    
      <div class="header-search-container">
        <input type="text" placeholder="Search for recipes..." class="header-search-bar" />
      </div>

      <nav class="header-nav-links">
        <a href="/src/pages/home.html" class="header-button">Home</a>
        <a href="/src/pages/recipes.html" class="header-button">Recipes</a>
        <a href="/src/pages/about.html" class="header-button">About Us</a>
        <a href="/src/pages/home/html" class="header-button">Feeds</a>
        <a href="#" class="header-button">Reels & Videos</a>
        <a href="#" class="header-button">Notifications</a>
      </nav>
    
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