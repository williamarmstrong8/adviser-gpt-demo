import { useState, useEffect } from 'react';

export interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  companyName: string;
  avatar?: string;
}

const defaultProfile: UserProfile = {
  firstName: 'Alex',
  lastName: 'Wright',
  fullName: 'Alex Wright',
  email: 'alex.wright@s2strategy.com',
  role: 'Senior Advisor',
  companyName: 'S2 Strategy',
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('user-profile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      } catch (error) {
        console.error('Error parsing saved profile:', error);
        setProfile(defaultProfile);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('user-profile', JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      
      // Auto-generate fullName if firstName or lastName changes
      if (updates.firstName || updates.lastName) {
        const firstName = updates.firstName ?? prev.firstName;
        const lastName = updates.lastName ?? prev.lastName;
        updated.fullName = `${firstName} ${lastName}`.trim();
      }
      
      return updated;
    });
  };

  const updateAvatar = (avatar: string | null) => {
    if (avatar) {
      updateProfile({ avatar });
    } else {
      setProfile(prev => {
        const { avatar: _, ...profileWithoutAvatar } = prev;
        return profileWithoutAvatar;
      });
    }
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
  };

  return {
    profile,
    updateProfile,
    updateAvatar,
    resetProfile,
    isLoaded,
  };
}
