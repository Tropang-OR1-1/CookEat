import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token'); // Get token from localStorage

  if (!token) {
    // Redirect to root if no token
    return <Navigate to="/" />;
  }

  return children; // Render the children (protected route) if token exists
}

export default PrivateRoute;
