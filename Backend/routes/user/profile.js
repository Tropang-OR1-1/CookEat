const fetchProfile = useCallback(async (forceRefresh = false, owner_id = 'me') => {
  const token = localStorage.getItem('token');
  if (!token) {
    setProfile({ AVATAR: DEFAULT_AVATAR, USERNAME: 'New User' });
    setLoading(false);
    return;
  }

  if (!forceRefresh) {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile && owner_id === 'me') { // Only cache for current user
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
    const url = `https://cookeat.cookeat.space/user/profile/${owner_id}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profileData = response.data?.Profile;

    if (!profileData) throw new Error('No profile data');

    const avatar = profileData.picture
      ? `https://cookeat.cookeat.space/media/profile/${profileData.picture}`
      : DEFAULT_AVATAR;

    const username = profileData.username || 'New User';

    const newProfile = { AVATAR: avatar, USERNAME: username };

    if (owner_id === 'me') {
      localStorage.setItem('profile', JSON.stringify({ avatar, username }));
    }

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
