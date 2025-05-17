import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const DEFAULT_AVATAR = 'https://www.w3schools.com/howto/img_avatar.png';

const UserProfileContext = createContext(null);

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({ AVATAR: DEFAULT_AVATAR, USERNAME: 'New User' });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setProfile({ AVATAR: DEFAULT_AVATAR, USERNAME: 'New User' });
      setLoading(false);
      return;
    }

    if (!forceRefresh) {
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          setProfile({
            AVATAR: parsed.avatar || DEFAULT_AVATAR,
            USERNAME: parsed.username || 'New User',
          });
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('profile');
        }
      }
    }

    try {
      const response = await axios.get('https://cookeat.cookeat.space/user/profile/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileData = response.data?.Profile;

      if (!profileData) throw new Error('No profile data');

      const avatar = profileData.picture
        ? `https://cookeat.cookeat.space/media/profile/${profileData.picture}`
        : DEFAULT_AVATAR;

      const username = profileData.username || 'New User';

      const newProfile = { AVATAR: avatar, USERNAME: username };

      localStorage.setItem('profile', JSON.stringify({ avatar, username }));

      setProfile(newProfile);
    } catch (err) {
      console.warn('Failed to fetch profile, using fallback:', err);

      try {
        const decoded = jwtDecode(token);
        setProfile({
          AVATAR: DEFAULT_AVATAR,
          USERNAME: decoded?.username || 'New User',
        });
      } catch {
        setProfile({ AVATAR: DEFAULT_AVATAR, USERNAME: 'New User' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <UserProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Hook for easier consumption in components
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === null) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
