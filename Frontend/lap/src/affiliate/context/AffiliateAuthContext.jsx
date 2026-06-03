// src/affiliate/context/AffiliateAuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AffiliateAuthContext = createContext();

export const AffiliateAuthProvider = ({ children }) => {
  const [affiliateUser, setAffiliateUser] = useState(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Use LAP's access token — key is 'access'
        const token = localStorage.getItem('access');
        if (token) {
          const profile = await authService.getCurrentUser();
          setAffiliateUser(profile);
          if (profile.referralCode) {
            localStorage.setItem('affiliate_ref_code', profile.referralCode);
          }
        }
      } catch (err) {
        console.error('Affiliate profile load failed:', err);
        setAffiliateUser(null);
      } finally {
        setAffiliateLoading(false);
      }
    };
    init();
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setAffiliateUser(updated);
    return updated;
  }, []);

  const register = useCallback(async (registerData) => {
    const created = await authService.register(registerData);
    setAffiliateUser(created);
    localStorage.setItem('affiliate_onboarded', 'true');
    if (created?.referralCode) {
      localStorage.setItem('affiliate_ref_code', created.referralCode);
    }
    return created;
  }, []);

  const logout = useCallback(() => {
    setAffiliateUser(null);
    localStorage.removeItem('affiliate_onboarded');
    localStorage.removeItem('affiliate_ref_code');
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authService.getCurrentUser();
    setAffiliateUser(profile);
    return profile;
  }, []);

  return (
    <AffiliateAuthContext.Provider
      value={{
        user: affiliateUser,
        isAuthenticated: !!affiliateUser,
        loading: affiliateLoading,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AffiliateAuthContext.Provider>
  );
};
