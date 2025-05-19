import React, { useState, useEffect } from 'react';
import './styles/EditPost.css';

const allowedVisibilities = ['public', 'private'];

const EditPost = ({
  isOpen,
  onCancel,
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
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [deleteMedia, setDeleteMedia] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedTitle(title || '');
      setEditedContent(content || '');
      setTags('');
      setVisibility('public');
      setDeleteMedia('');
      setMediaFiles([]);
      setError('');
    }
  }, [isOpen, title, content]);

  const handleFileChange = (e) => {
    setMediaFiles([...e.target.files]);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    const formData = new FormData();

    if (editedTitle.trim() !== '') formData.append('title', editedTitle.trim());
    if (editedContent.trim() !== '') formData.append('content', editedContent.trim());

    if (tags.trim() !== '') {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      // Append each tag as 'tags' (without brackets)
      tagsArray.forEach((tag) => formData.append('tags', tag));
    }

    if (visibility && allowedVisibilities.includes(visibility)) {
      formData.append('visibility', visibility);
    }

    if (deleteMedia) {
      formData.append('deletemedia', 'all');
    }

    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://cookeat.cookeat.space/posts/${public_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update post.');
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError('Network error, please try again.');
    }

    setLoading(false);
  };

  return (
    <>
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-box">
              <h3 className="modal-box__title">Edit Post</h3>

              {error && <p className="error-msg">{error}</p>}

              <label className="form-label" htmlFor="title-input">Title</label>
              <input
                id="title-input"
                className="form-input"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                maxLength={100}
                placeholder="Enter title"
              />

              <label className="form-label" htmlFor="content-textarea">Content</label>
              <textarea
                id="content-textarea"
                className="form-textarea"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={5}
                placeholder="Enter content"
              />

              <label className="form-label" htmlFor="tags-input">Tags (comma separated)</label>
              <input
                id="tags-input"
                className="form-input"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="bkendErr: 'Input should be a valid array.'"
              />

              <label className="form-label" htmlFor="visibility-select">Visibility</label>
              <select
                id="visibility-select"
                className="form-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              <label className="form-label" htmlFor="media-upload">Upload Media</label>
              <label htmlFor="media-upload" className="media-upload-label">
                Choose Files
              </label>
              <input
                id="media-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
              />

              <div className="form-checkbox">
                <input
                  id="deletemedia-checkbox"
                  type="checkbox"
                  checked={deleteMedia === 'all'}
                  onChange={(e) => setDeleteMedia(e.target.checked ? 'all' : '')}
                  className="big-checkbox"
                />
                <label htmlFor="deletemedia-checkbox">Delete Post Media</label>
              </div>

              <div className="modal-actions">
                <button className="btn cancel" onClick={onCancel} disabled={loading}>
                  Cancel
                </button>
                <button className="btn save" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditPost;
