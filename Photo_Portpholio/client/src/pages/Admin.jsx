import { useState, useEffect } from 'react';
import { getPhotos, savePhoto, deletePhoto, migrateFromLocalStorage } from '../utils/photoStorage';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [requests, setRequests] = useState([]);
  const [gallery, setGallery] = useState([]);

  const correctPassword = 'admin123'; // Change if needed

  // Fetch the requests and gallery from IndexedDB on component mount
  useEffect(() => {
    const loadData = async () => {
      // Ensure any existing data is migrated from localStorage
      await migrateFromLocalStorage();
      
      // Load pending and approved photos
      const pendingPhotos = await getPhotos('pending');
      const approvedPhotos = await getPhotos('approved');
      
      setRequests(pendingPhotos);
      setGallery(approvedPhotos);
    };
    
    loadData().catch(console.error);
  }, []);

  // Handle authentication logic
  const handleAuth = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert('❌ Wrong password!');
    }
  };

  // Handle approval of photo request
  const approveRequest = async (id) => {
    try {
      const photo = requests.find((req) => req.id === id);
      if (!photo) {
        console.error('Photo not found in requests');
        return;
      }

      // Update photo status to approved
      const approvedPhoto = { ...photo, status: 'approved' };
      
      try {
        // Save the updated photo status to IndexedDB
        await savePhoto(approvedPhoto);
        
        // Update UI state
        setGallery(prev => [...prev, approvedPhoto]);
        setRequests(prev => prev.filter(req => req.id !== id));
        
      } catch (error) {
        console.error('Failed to approve photo:', error);
        alert('Failed to approve photo. Please try again.');
      }
      
    } catch (error) {
      console.error('Error approving photo:', error);
      alert('An error occurred while approving the photo.');
    }
  };

  // Handle deletion of photo request
  const deleteRequest = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this photo request?");
    if (!confirmDelete) return;

    try {
      await deletePhoto(id);
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error('Failed to delete photo request:', error);
      alert('Failed to delete photo request. Please try again.');
    }
  };

  // Handle deletion of approved photo from the gallery
  const deleteApprovedPhoto = async (id) => {
    const confirmDelete = window.confirm("Delete this photo from approved gallery?");
    if (!confirmDelete) return;

    try {
      await deletePhoto(id);
      setGallery(prev => prev.filter(img => img.id !== id));
    } catch (error) {
      console.error('Failed to delete approved photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>🔐 Admin Login</h2>
        <form onSubmit={handleAuth}>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" style={{ marginLeft: '10px', padding: '10px 20px' }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  // Main Admin Panel
  return (
    <div style={{ padding: '40px' }}>
      <h1>📥 Pending Photo Requests</h1>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {requests.map((req) => (
            <div key={req.id} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              width: '200px',
              background: '#f9f9f9'
            }}>
              <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '10px' }}>
                <img 
                  src={req.image} 
                  alt={req.title} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '5px'
                  }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg width=\'200\' height=\'150\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'sans-serif\' font-size=\'14\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%23999\'%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <h3 style={{ margin: '5px 0', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.title}</h3>
              {req.user && <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>By: {req.user}</p>}
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => approveRequest(req.id)} 
                  style={{ 
                    marginRight: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Approve
                </button>
                <button 
                  onClick={() => deleteRequest(req.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr style={{ margin: '40px 0' }} />

      <h1>✅ Approved Gallery</h1>
      {gallery.length === 0 ? (
        <p>No approved photos yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {gallery.map((img) => (
            <div key={img.id} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              width: '200px',
              background: '#e8ffe8'
            }}>
              <img src={img.image} alt={img.title} style={{ width: '100%', borderRadius: '5px' }} />
              <h3>{img.title}</h3>
              {img.user && <p>By: {img.user}</p>}
              <button
                onClick={() => deleteApprovedPhoto(img.id)}
                style={{ marginTop: '8px', background: '#ffdddd' }}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
