import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './styles/feedpostdropdown.css';

const FeedPostDropdown = ({ postId }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="options" ref={dropdownRef}>
      <button className="dropdown-btn" onClick={toggleDropdown}>
        ...
      </button>
      {isDropdownOpen && (
        <div className={`dropdown-content ${isDropdownOpen ? 'show' : ''}`}>
          <Link to={`/edit/${postId}`}>Edit</Link>
          <Link to={`/delete/${postId}`}>Delete</Link>
          <Link to={`/report/${postId}`}>Report</Link>
        </div>
      )}
    </div>
  );
};

export default FeedPostDropdown;
