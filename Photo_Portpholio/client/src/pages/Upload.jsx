import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { savePhoto, migrateFromLocalStorage } from '../utils/photoStorage';

// Helper function to compress image
const compressImage = (file, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 1200px on the longest side)
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with specified quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // If the compressed version is larger than original, use original
          if (blob.size > file.size) {
            resolve(file);
          } else {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          }
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Function to clean up old photos
const cleanupOldPhotos = () => {
  try {
    const savedRequests = JSON.parse(localStorage.getItem('photoRequests') || '[]');
    const approvedPhotos = JSON.parse(localStorage.getItem('approvedPhotos') || '[]');
    
    // Keep only the 100 most recent requests and approved photos
    const MAX_ITEMS = 50;
    const cleanedRequests = savedRequests.slice(-MAX_ITEMS);
    const cleanedApproved = approvedPhotos.slice(-MAX_ITEMS);
    
    // Save back to localStorage
    localStorage.setItem('photoRequests', JSON.stringify(cleanedRequests));
    localStorage.setItem('approvedPhotos', JSON.stringify(cleanedApproved));
    
    return cleanedRequests.length < savedRequests.length || 
           cleanedApproved.length < approvedPhotos.length;
  } catch (error) {
    console.error('Error cleaning up photos:', error);
    return false;
  }
};

const Upload = ({ darkMode }) => {
  const [title, setTitle] = useState('');
  const [user, setUser] = useState('');
  const [image, setImage] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [file, setFile] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleImageUpload = (e) => {
    const uploadedFile = e.target.files[0];
    
    // Reset file input to allow re-uploading the same file after error
    e.target.value = '';
    
    if (!uploadedFile) {
      console.log('No file selected');
      return;
    }

    // Check if file is an image
    if (!uploadedFile.type || !uploadedFile.type.startsWith('image/')) {
      alert("⚠️ The selected file is not a valid image. Please upload an image file.");
      return;
    }

    // Check for specific image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileType = uploadedFile.type.toLowerCase();
    if (!allowedTypes.includes(fileType)) {
      const supportedFormats = allowedTypes.map(t => t.split('/')[1]).join(', ');
      alert(`❌ Unsupported image format. Please upload one of these formats: ${supportedFormats}`);
      return;
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (uploadedFile.size > maxSize) {
      const sizeInMB = (uploadedFile.size / (1024 * 1024)).toFixed(2);
      alert(`⚠️ Image is too large (${sizeInMB}MB). Maximum allowed size is 5MB.`);
      return;
    }

    // Create a temporary image to validate dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(uploadedFile);
    
    img.onload = function() {
      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(objectUrl);
      
      const minDimension = 100; // Minimum width/height in pixels
      if (this.width < minDimension || this.height < minDimension) {
        alert(`⚠️ Image dimensions (${this.width}x${this.height}px) are too small. Minimum size is ${minDimension}x${minDimension} pixels.`);
        return;
      }
      
      // If we got here, the image is valid
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        // Could show a loading indicator here
      };
      
      reader.onloadend = () => {
        if (reader.error) {
          console.error('Error reading file:', reader.error);
          alert('❌ Error reading the image file. Please try another image.');
          return;
        }
        setImage(reader.result);
        setFile(uploadedFile);
      };
      
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        alert('❌ Failed to process the image. Please try another file.');
      };
      
      reader.readAsDataURL(uploadedFile);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.error('Image loading error');
      alert('❌ The selected file appears to be corrupted or not a valid image.');
    };
    
    img.src = objectUrl;
  };

  // Run migration on component mount
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!title.trim() || !user.trim() || !image) {
      alert("Please fill all required fields and upload an image.");
      return;
    }

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Uploading...';

    try {
      // Compress the image before saving
      let compressedImage = image;
      if (file) {
        try {
          const compressedFile = await compressImage(file);
          const reader = new FileReader();
          compressedImage = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(compressedFile);
          });
        } catch (compressError) {
          console.warn('Image compression failed, using original:', compressError);
          // Continue with original image if compression fails
        }
      }

      // Create a new photo object with additional metadata
      const newPhoto = {
        id: uuidv4(),
        title: title.trim(),
        user: user.trim(),
        image: compressedImage,
        tags: tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        size: compressedImage.length
      };

      try {
        // Save to IndexedDB
        await savePhoto(newPhoto);
        
        // Reset form
        setTitle('');
        setUser('');
        setImage('');
        setTagsInput('');
        setFile(null);
        
        // Show success message
        alert("🎉 Photo uploaded successfully! It's now pending admin approval.");
      } catch (error) {
        console.error('Failed to save photo:', error);
        alert('❌ Failed to save photo. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
      alert('❌ An error occurred while submitting the photo. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      style={{
        minHeight: '100vh',
        background: darkMode
          ? '#000000'
          : 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '80px 20px 20px',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        transition: 'background 0.3s ease'
      }}
    >
      {/* Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
          >
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              color: '#333',
              position: 'relative',
            }}>
              <h3 style={{ marginBottom: '15px' }}>File Too Large</h3>
              <p>Please upload an image smaller than 5MB.</p>
              <button
                onClick={() => setShowPopup(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#333'
                }}
              >
                ❌
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Form */}
      <div style={{
        maxWidth: '500px',
        width: '100%',
        padding: '30px',
        borderRadius: '16px',
        background: darkMode ? 'rgba(20, 20, 20, 0.9)' : 'rgba(255, 255, 255, 0.85)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: darkMode ? '#f0f0f0' : '#333',
        transition: 'all 0.3s ease'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📤 Submit a Photo</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="Photo Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none'
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none'
            }}
          />

          {image && (
            <img
              src={image}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '10px',
                marginTop: '10px',
                border: '1px solid #ddd'
              }}
            />
          )}

          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ff6f61',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Submit Photo
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Upload;
