import React, { useState, useEffect } from 'react';
import FadeInSection from '../components/FadeInSection';
import { getPhotos } from '../utils/photoStorage';

const Gallery = ({ darkMode }) => {
  const [photos, setPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Load approved photos from IndexedDB
        const approvedPhotos = await getPhotos('approved');
        setPhotos(approvedPhotos);

        // Load likes and comments from localStorage (keeping this as is for now)
        const storedLikes = JSON.parse(localStorage.getItem('photoLikes')) || {};
        setLikes(storedLikes);

        const storedComments = JSON.parse(localStorage.getItem('photoComments')) || {};
        setComments(storedComments);
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    };

    loadPhotos();
  }, []);

  const handleDownload = async (e, photo) => {
    e.stopPropagation();
    try {
      const response = await fetch(photo.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${photo.title || 'download'}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleLike = (e, photoId) => {
    e.stopPropagation();
    const updatedLikes = { ...likes, [photoId]: (likes[photoId] || 0) + 1 };
    setLikes(updatedLikes);
    localStorage.setItem('photoLikes', JSON.stringify(updatedLikes));
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const updated = [...(comments[selectedPhoto.id] || []), newComment.trim()];
    const updatedComments = { ...comments, [selectedPhoto.id]: updated };
    setComments(updatedComments);
    setNewComment('');
    localStorage.setItem('photoComments', JSON.stringify(updatedComments));
  };

  const handleDeleteComment = (idx) => {
    const updated = [...comments[selectedPhoto.id]];
    updated.splice(idx, 1);
    const updatedComments = { ...comments, [selectedPhoto.id]: updated };
    setComments(updatedComments);
    localStorage.setItem('photoComments', JSON.stringify(updatedComments));
  };

  const handleShare = (e, url) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      alert('📎 Image URL copied to clipboard!');
    });
  };

  const filteredPhotos = photos.filter(photo =>
    photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div
      style={{
        backgroundColor: darkMode ? '#121212' : '#f0f0f0',
        color: darkMode ? '#ffffff' : '#000000',
        minHeight: '100vh',
        padding: '20px',
        transition: 'all 0.3s ease'
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📷 Photo Gallery</h2>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Search by title or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            width: '300px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            outline: 'none'
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredPhotos.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No photos found.</p>
        ) : (
          filteredPhotos.map(photo => (
            <FadeInSection key={photo.id}>
              <div
                onClick={() => setSelectedPhoto(photo)}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  padding: '10px',
                  boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                  backgroundColor: darkMode ? '#222' : '#fff',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={photo.image}
                  alt={photo.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '5px',
                    marginBottom: '10px',
                    transition: 'transform 0.4s ease',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <h3>{photo.title}</h3>
                {photo.uploader && <p><strong>By:</strong> {photo.uploader}</p>}
                <div style={{ marginBottom: '10px' }}>
                  {photo.tags?.map((tag, idx) => (
                    <span key={idx} style={{
                      display: 'inline-block',
                      backgroundColor: darkMode ? '#444' : '#eee',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      marginRight: '5px',
                      fontSize: '12px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => handleDownload(e, photo)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#0d6efd',
                    color: '#fff',
                    borderRadius: '5px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ⬇ Download
                </button>
              </div>
            </FadeInSection>
          ))
        )}
      </div>

      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <button onClick={() => setSelectedPhoto(null)} style={{
            position: 'absolute',
            top: '20px',
            right: '30px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '30px',
            cursor: 'pointer'
          }}>✖</button>

          <div style={{
            display: 'flex',
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(0,0,0,0.3)'
          }}>
            <img
              src={selectedPhoto.image}
              alt={selectedPhoto.title}
              style={{
                maxWidth: '600px',
                objectFit: 'contain',
                borderRadius: '12px 0 0 12px'
              }}
            />
            <div style={{
              padding: '20px',
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#f9f9f9'
            }}>
              <div>
                <h3>{selectedPhoto.title}</h3>
                {selectedPhoto.uploader && <p><strong>By:</strong> {selectedPhoto.uploader}</p>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <button onClick={(e) => handleLike(e, selectedPhoto.id)} style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'red'
                  }}>❤️</button>

                  <button onClick={(e) => handleShare(e, selectedPhoto.image)} style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: '#007bff'
                  }} title="Share">📤</button>
                </div>

                <p style={{ fontSize: '14px', marginTop: '6px' }}>{likes[selectedPhoto.id] || 0} likes</p>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>💬 Comments</h4>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '8px',
                  background: '#fff'
                }}>
                  {(comments[selectedPhoto.id] || []).map((comment, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee'
                    }}>
                      <p style={{ fontSize: '14px', margin: 0 }}>💬 {comment}</p>
                      <button
                        onClick={() => handleDeleteComment(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          fontSize: '16px',
                          cursor: 'pointer'
                        }}
                        title="Delete comment"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleCommentSubmit} style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      padding: '8px',
                      width: '100%',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      outline: 'none',
                    }}
                  />
                  <button type="submit" style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    width: '100%',
                    cursor: 'pointer'
                  }}>
                    Post Comment
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
