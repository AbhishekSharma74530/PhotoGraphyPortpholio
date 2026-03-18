const DB_NAME = 'PhotoPortfolioDB';
const STORE_NAME = 'photos';
const VERSION = 1;

let db = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const savePhoto = async (photo) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put(photo);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error saving photo:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to save photo:', error);
    throw error;
  }
};

export const getPhotos = async (type = 'all') => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allPhotos = request.result || [];
        if (type === 'all') {
          resolve(allPhotos);
        } else {
          resolve(allPhotos.filter(photo => photo.status === type));
        }
      };
      
      request.onerror = (event) => {
        console.error('Error getting photos:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to get photos:', error);
    throw error;
  }
};

export const deletePhoto = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error deleting photo:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    throw error;
  }
};

// Migrate existing localStorage data to IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    // Check if migration is needed
    const migrationKey = 'migratedToIndexedDB';
    if (localStorage.getItem(migrationKey)) return;

    const savedRequests = JSON.parse(localStorage.getItem('photoRequests') || '[]');
    const approvedPhotos = JSON.parse(localStorage.getItem('approvedPhotos') || '[]');

    // Combine and prepare photos for migration
    const photosToMigrate = [
      ...savedRequests.map(photo => ({ ...photo, status: 'pending' })),
      ...approvedPhotos.map(photo => ({ ...photo, status: 'approved' }))
    ];

    // Save each photo to IndexedDB
    for (const photo of photosToMigrate) {
      await savePhoto(photo);
    }

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
    
    // Optionally clear localStorage
    // localStorage.removeItem('photoRequests');
    // localStorage.removeItem('approvedPhotos');
    
    console.log('Migration to IndexedDB completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
