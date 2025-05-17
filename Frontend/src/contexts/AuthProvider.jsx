import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [profile, setProfile] = useState(() => {
    const storedProfile = localStorage.getItem("profile");
    return storedProfile ? JSON.parse(storedProfile) : null;
  });
  const [avatar, setAvatar] = useState(() => {
    const storedAvatar = localStorage.getItem("avatar");
    return storedAvatar || "default-avatar.jpg";
  });

  // Sync localStorage and state when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("profile");
      localStorage.removeItem("avatar");
      setProfile(null);
      setAvatar("default-avatar.jpg");
    }
  }, [token]);

  // When profile changes, sync avatar and localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem("profile", JSON.stringify(profile));
      if (profile.avatar) {
        setAvatar(profile.avatar);
        localStorage.setItem("avatar", profile.avatar);
      }
    }
  }, [profile]);

  return (
    <AuthContext.Provider value={{ token, setToken, profile, setProfile, avatar, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}
