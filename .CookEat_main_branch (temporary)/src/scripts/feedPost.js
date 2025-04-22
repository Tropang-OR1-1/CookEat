// Like Button
const likeButton = document.querySelector('.like-btn');
likeButton.addEventListener('click', () => {
    const likeCount = document.querySelector('.like-count');
    const currentLikes = parseInt(likeCount.textContent.split(' ')[0]);
    likeCount.textContent = `${currentLikes + 1} Likes`;
});

// Comment Button (Optional: Can be enhanced to open comment section)
const commentButton = document.querySelector('.comment-btn');
commentButton.addEventListener('click', () => {
    alert('Open comment section');
});

// Share Button
const shareButton = document.querySelector('.share-btn');
shareButton.addEventListener('click', () => {
    alert('Share this post');
});
