// src/leads/context/AuthContext.jsx
import { useApp } from './AppContext';

export const useAuth = () => {
  const { user } = useApp();
  return { user };
};

export default useAuth;
