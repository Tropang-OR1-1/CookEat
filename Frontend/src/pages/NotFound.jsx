import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles/notfound.css";

function NotFound() {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    // Get the height of the header dynamically
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.offsetHeight);
    }
  }, []);

  return (
    <div className="not-found" style={{ minHeight: `calc(100vh - ${headerHeight}px) - 5px` }}>
      <h1 className="not-found-title">404 - Page Not Found</h1>
      <p className="not-found-message">Sorry, the page you're looking for does not exist.</p>
      <Link to="/feeds" className="not-found-link">Go back to Feed</Link>
    </div>
  );
}

export default NotFound;
