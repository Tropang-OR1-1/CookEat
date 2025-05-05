import React, { useState, useRef } from 'react';
import { FaPhotoVideo } from 'react-icons/fa';
import './styles/createpost.css';

function CreatePost({ isOpen, onClose }) {
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState(null);
  const fileInputRef = useRef();

  const handleMediaChange = (e) => {
    setMedia(e.target.files?.[0] ?? null);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!caption && !media) {
      alert("Write something or upload media.");
      return;
    }
    console.log({ caption, media });
    alert("Post submitted (check console for payload)");

    setCaption('');
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-post-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="post-box">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2 className="modal-title">Create a Post</h2>

        {/* User Info Section (Fixed) */}
        <div className="user-info">
          <img src="/public/images/feedPost_img/lebrown.jpg" alt="User Icon" className="user-icon" />
          <div className="user-name">LeBrown James</div>
        </div>

        {/* Scrollable Content */}
        <div className="scrollable-content">
          <form onSubmit={handleSubmit}>
            <textarea
              className="caption-input"
              placeholder="Anything you want to share?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            ></textarea>

            {media && (
              <div className="media-preview">
                <button className="remove-media-btn" onClick={handleRemoveMedia} type="button">&times;</button>
                {media.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(media)} alt="preview" />
                ) : (
                  <video controls src={URL.createObjectURL(media)} />
                )}
              </div>
            )}

            <div className="media-upload">
              <label htmlFor="media" className="custom-file-upload">
                <FaPhotoVideo className="media-icon" />
                Add to your post
              </label>
              <input
                id="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                ref={fileInputRef}
                hidden
              />
            </div>

            <button type="submit" className="publish-btn">Publish Post</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
