import React, { useEffect } from 'react';
import './styles/settings.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ActivityLogIcon from '@mui/icons-material/Assignment';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PrivacyCenterIcon from '@mui/icons-material/PrivacyTip';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';

function Settings() {
  useEffect(() => {
    const container = document.querySelector('.settings-container');
    if (container) container.classList.add('show');
  }, []);

  const goBack = () => {
    const settingsPage = document.querySelector(".settings-container");
    if (settingsPage) {
      settingsPage.style.opacity = "0";
      settingsPage.style.transform = "translateY(20px)";
      setTimeout(() => {
        window.history.back();
      }, 300);
    }
  };

  return (
    <>
      <div className="settings-container">
        <div className="setting-feed">
          <h3>Find the settings you need</h3>
          <div className="search-box">
            <input type="text" placeholder="🔍 Search settings" />
          </div>

          <h3 className="section-title">Most visited settings</h3>
          <div className="most-visited">
            <div className="setting-card">
              <VisibilityIcon className="setting-icon" />
              <h4>Audience and Visibility</h4>
              <p>Control who can see your food posts and recipes.</p>
            </div>
            <div className="setting-card">
              <ActivityLogIcon className="setting-icon" />
              <h4>Activity log</h4>
              <p>View and manage your activity on Cook Eat.</p>
            </div>
            <div className="setting-card">
              <DarkModeIcon className="setting-icon" />
              <h4>Dark mode</h4>
              <p>Choose if you want to use dark mode.</p>
            </div>
          </div>

          <h3 className="section-title">Looking for something else?</h3>
          <div className="extra-setting">
            <PrivacyCenterIcon className="extra-icon" />
            <div className="extra-content">
              <h4>Privacy Center</h4>
              <p>Learn how to manage and control your privacy across Meta products.</p>
            </div>
            <span className="arrow">→</span>
          </div>
          <div className="extra-setting">
            <HelpCenterIcon className="extra-icon" />
            <div className="extra-content">
              <h4>Cook Eat Help Center</h4>
              <p>Learn more about our updated settings experience on Cook Eat.</p>
            </div>
            <span className="arrow">→</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;