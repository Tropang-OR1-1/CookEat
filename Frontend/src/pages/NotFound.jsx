import React from "react";
import { Link } from "react-router-dom";
import "./styles/notfound.css";

function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found-title">404 - Page Not Found</h1>
      <p className="not-found-message">Sorry, the page you're looking for does not exist.</p>
      <Link to="/" className="not-found-link">Go back to Home</Link>
    </div>
  );
}

export default NotFound;
