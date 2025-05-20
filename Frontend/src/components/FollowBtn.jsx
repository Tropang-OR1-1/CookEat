
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FollowButton({ public_id, isOwnProfile, onFollowersCountChange }) {
  const [isFollowing, setIsFollowing] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');

  const refreshFollowStatus = async () => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `https://cookeat.cookeat.space/user/followings/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const followings = res.data.followings || [];
      const followed = followings.some(
        (user) => user.public_id?.trim().toLowerCase() === public_id?.trim().toLowerCase()
      );
      setIsFollowing(followed);
    } catch (err) {
      console.error('Error checking follow status:', err);
      setIsFollowing(null);
    }
    setStatusLoading(false);
  };

  const refreshFollowersCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `https://cookeat.cookeat.space/user/followers/${public_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const count = res.data.followers?.length || 0;
      onFollowersCountChange(count);
    } catch (err) {
      console.error('Error refreshing followers count:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (isOwnProfile || !isLoggedIn) return;

    setFollowLoading(true);
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
      await axios.post(
        `https://cookeat.cookeat.space/user/${endpoint}/${public_id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setIsFollowing((prev) => !prev);
      await refreshFollowersCount();

    } catch (err) {
      console.error(`${endpoint} error:`, err);
      alert(`Failed to ${endpoint} user.`);
    }

    setFollowLoading(false);
  };

  useEffect(() => {
    if (!isOwnProfile && isLoggedIn && public_id) {
      refreshFollowStatus();
    } else {
      setIsFollowing(null);
    }
  }, [public_id, isOwnProfile, isLoggedIn]);

  if (isOwnProfile || !isLoggedIn || statusLoading || isFollowing === null) return null;

  return (
    <button
      className="edit-profile-btn"
      onClick={handleFollowToggle}
      disabled={followLoading}
      style={isFollowing ? { backgroundColor: '#FF7043' } : {}}
    >
      {followLoading
        ? isFollowing
          ? 'Unfollowing...'
          : 'Following...'
        : isFollowing
        ? 'Unfollow'
        : 'Follow'}
    </button>
  );
}

export default FollowButton;
