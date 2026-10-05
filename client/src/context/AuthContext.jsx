import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const registering = useRef(false);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await api('/auth/me');
      setProfile(me);
      return me;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (registering.current) return; // register() sets the profile itself
      if (user) await refreshProfile();
      else setProfile(null);
      setLoading(false);
    });
  }, [refreshProfile]);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const me = await refreshProfile();
    if (!me) {
      await signOut(auth);
      throw new Error('No UniBike profile found for this account');
    }
    return me;
  };

  const register = async ({ name, studentId, email, password }) => {
    registering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try {
        const me = await api('/auth/profile', { method: 'POST', body: { name, studentId } });
        setProfile(me);
        return me;
      } catch (err) {
        await deleteUser(cred.user).catch(() => {}); // roll back the auth account
        throw err;
      }
    } finally {
      registering.current = false;
      setLoading(false);
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
