import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />; // Redirect to root if invalid token / no token
  }

  return children; // Render the children (protected route) if token exists
}

export default PrivateRoute;
