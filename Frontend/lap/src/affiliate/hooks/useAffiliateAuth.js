// src/affiliate/hooks/useAffiliateAuth.js
import { useContext } from 'react';
import { AffiliateAuthContext } from '../context/AffiliateAuthContext';

export const useAuth = () => {
  const context = useContext(AffiliateAuthContext);
  if (!context) throw new Error('useAuth must be used within AffiliateAuthProvider');
  return context;
};

export default useAuth;