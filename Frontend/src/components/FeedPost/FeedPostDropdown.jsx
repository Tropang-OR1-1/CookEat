import React, { useState, useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditPost from './EditPost';
import DeletePost from './DeletePost';

import './styles/feedpostdropdown.css';

const FeedPostDropdown = ({
  public_id,
  title,
  content,
  created_at,
  updated_at,
  view_count,
  media_filename,
  media_type,
  reactions_total,
  user_reacted,
  comment_count,
  ref_public_id,
  author_public_id,
  author_username,
  author_picture
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const loggedInPublicId = localStorage.getItem('public_id');
  const isAuthor = loggedInPublicId === author_public_id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);

  const openEditModal = () => {
    setIsDropdownOpen(false);
    setShowEditModal(true);
  };

  const openDeleteModal = () => {
    setIsDropdownOpen(false);
    setShowDeleteModal(true);
  };

  const handleSavePost = () => {
    console.log(`Saved post ${public_id}`);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <div className="options" ref={dropdownRef}>
        <IconButton
          ref={toggleButtonRef}
          onClick={toggleDropdown}
          aria-label="Post options"
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          aria-controls={`post-options-menu-${public_id}`}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>

        {isDropdownOpen && (
          <div
            id={`post-options-menu-${public_id}`}
            className="dropdown-content show"
            role="menu"
          >
            <button className="dropdown-item" role="menuitem" onClick={handleSavePost}>
              Save
            </button>

            {isAuthor ? (
              <>
                <button className="dropdown-item" role="menuitem" onClick={openEditModal}>
                  Edit
                </button>
                <button className="dropdown-item" role="menuitem" onClick={openDeleteModal}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    console.log(`Reported ${public_id}`);
                    setIsDropdownOpen(false);
                  }}
                >
                  Report
                </button>
                <button
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    console.log(`Hide post ${public_id}`);
                    setIsDropdownOpen(false);
                  }}
                >
                  Hide
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditPost
          isOpen={showEditModal}
          onCancel={() => setShowEditModal(false)}
          public_id={public_id}
          title={title}
          content={content}
          created_at={created_at}
          updated_at={updated_at}
          view_count={view_count}
          media_filename={media_filename}
          media_type={media_type}
          reactions_total={reactions_total}
          user_reacted={user_reacted}
          comment_count={comment_count}
          ref_public_id={ref_public_id}
          author_public_id={author_public_id}
          author_username={author_username}
          author_picture={author_picture}
        />
      )}

      {showDeleteModal && (
        <DeletePost
          isOpen={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          public_id={public_id}
        />
      )}
    </>
  );
};

export default FeedPostDropdown;
