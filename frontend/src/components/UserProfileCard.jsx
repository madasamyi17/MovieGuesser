import React, { useRef, useState, useEffect } from "react";
import "../css/userProfileCard.css";
import axios from "axios";
import { profileCache } from "../utils/profileCache";
import defaultPic from "../images/default-pic.png";

function UserProfileCard({ 
  userProfile, 
  name, 
  currentScore = 0,
  totalScore = 0,
  maxScore = 0,
  onClose, 
  onViewLeaderboard,
  onProfileUpdate
}) {
  const fileInputRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileImage, setProfileImage] = useState(defaultPic);
  const [displayName, setDisplayName] = useState("");

  // Load profile data from cache or backend on mount
  useEffect(() => {
    const loadProfile = async () => {
      // Try to get from cache first
      const cached = profileCache.get();
      
      if (cached) {
        setProfileImage(cached.profileImage || defaultPic);
        setDisplayName(cached.displayName || userProfile?.email || "Guest");
        setEditedName(cached.displayName || userProfile?.email || "Guest");
      } else {
        // Fetch from backend if not cached
        try {
          const response = await axios.get('http://localhost:3000/auth/profile', {
            withCredentials: true
          });
          
          const userData = response.data.user;
          let imageUrl = defaultPic;
          
          if (userData.profile_image && userData.image_type) {
            imageUrl = `data:${userData.image_type};base64,${userData.profile_image}`;
          }
          
          const userName = userData.name || userProfile?.email || "Guest";
          
          setProfileImage(imageUrl);
          setDisplayName(userName);
          setEditedName(userName);
          
          // Cache the data
          profileCache.set({
            profileImage: imageUrl,
            displayName: userName
          });
        } catch (error) {
          console.error("Error fetching profile:", error);
          // Fallback to defaults
          const userName = userProfile?.email || "Guest";
          setDisplayName(userName);
          setEditedName(userName);
          setProfileImage(defaultPic);
        }
      }
    };

    loadProfile();
  }, [userProfile]);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please select a valid image file");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Clear cache before updating
      profileCache.clear();
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.put(
        'http://localhost:3000/auth/profile/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      if (response.data.profile_image && response.data.image_type) {
        const imageUrl = `data:${response.data.image_type};base64,${response.data.profile_image}`;
        setProfileImage(imageUrl);
        setSuccessMessage("Profile updated!");
        setTimeout(() => setSuccessMessage(""), 3000);
        
        // Update cache with new image
        profileCache.set({
          profileImage: imageUrl,
          displayName: displayName
        });
        
        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate({ picture: imageUrl });
        }
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setErrorMessage(error.response?.data?.message || "Failed to update profile");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setErrorMessage("");
  };

  const handleNameSave = async () => {
    const trimmedName = editedName.trim();
    
    if (!trimmedName) {
      setErrorMessage("Name cannot be empty");
      return;
    }

    if (trimmedName === displayName) {
      setIsEditingName(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Clear cache before updating
      profileCache.clear();
      
      const response = await axios.put(
        'http://localhost:3000/auth/profile/username',
        { name: trimmedName },
        { withCredentials: true }
      );

      setSuccessMessage("Username updated!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setIsEditingName(false);
      setDisplayName(trimmedName);
      
      // Update cache with new name
      profileCache.set({
        profileImage: profileImage,
        displayName: trimmedName
      });
      
      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate({ name: trimmedName });
      }
    } catch (error) {
      console.error("Error updating username:", error);
      if (error.response?.status === 409) {
        setErrorMessage("Username already taken");
      } else {
        setErrorMessage(error.response?.data?.message || "Failed to update username");
      }
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameCancel = () => {
    setEditedName(displayName);
    setIsEditingName(false);
    setErrorMessage("");
  };

  return (
    <div className="profile-card-overlay" onClick={onClose}>
      <div className="profile-card" onClick={(e) => e.stopPropagation()}>
        <button className="profile-card-close" onClick={onClose}>
          ×
        </button>
        
        {errorMessage && (
          <div className="profile-error-message">
            <span className="icon-error">✕</span> {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="profile-success-message">
            <span className="icon-success">✓</span> {successMessage}
          </div>
        )}
        
        <div className="profile-card-header">
          <div className="profile-image-container">
            <img
              src={profileImage}
              alt="Profile"
              className="profile-card-image"
            />
            <button 
              className="edit-profile-btn"
              onClick={handleProfilePictureClick}
              title="Edit profile picture"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              )}
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-name-container">
            {isEditingName ? (
              <div className="name-edit-wrapper">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="name-edit-input"
                  autoFocus
                  disabled={isLoading}
                  placeholder={userProfile?.email || "Enter username"}
                />
                <div className="name-edit-buttons">
                  <button 
                    className="save-btn" 
                    onClick={handleNameSave}
                    disabled={isLoading}
                    title="Save"
                  >
                    {isLoading ? (
                      <span className="spinner-small"></span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                  <button 
                    className="cancel-btn" 
                    onClick={handleNameCancel}
                    disabled={isLoading}
                    title="Cancel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="name-display-wrapper">
                <h3 className="profile-card-name">{displayName}</h3>
                <button 
                  className="edit-name-btn" 
                  onClick={handleNameEdit} 
                  title="Edit username"
                  disabled={isLoading}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <p className="profile-card-email">{userProfile?.email || ""}</p>
        </div>

        <div className="profile-card-stats">
          <div className="stat-item">
            <span className="stat-label">Current Game</span>
            <span className="stat-value">{currentScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Score</span>
            <span className="stat-value">{totalScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Score</span>
            <span className="stat-value">{maxScore}</span>
          </div>
        </div>

        <div className="profile-card-actions">
          <button className="profile-action-btn scoreboard-btn" onClick={onViewLeaderboard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            View Scoreboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfileCard;
