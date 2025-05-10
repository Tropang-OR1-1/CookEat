// used in FeedPost.jsx

export const formatDate = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} wk${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} mth${months > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} yr${years > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString(); // Full date (e.g., "January 1, 2022, 12:00 PM")
  }
};
