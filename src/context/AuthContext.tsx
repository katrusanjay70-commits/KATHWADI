import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { initializeDefaultPolicies } from '../services/dbInit';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: (selectedRole?: UserRole) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole, phone?: string, location?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (role?: UserRole) => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize official insurance policies catalog on boot
  useEffect(() => {
    initializeDefaultPolicies();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch or listen to profile
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // Give any concurrent registerWithEmail a brief moment before writing default
            await new Promise((r) => setTimeout(r, 400));
            const recheckSnap = await getDoc(userDocRef);
            if (recheckSnap.exists()) {
              setUserProfile(recheckSnap.data() as UserProfile);
            } else {
              const isDefaultAdmin = user.email === 'katrusanjay70@gmail.com';
              const newProfile: UserProfile = {
                userId: user.uid,
                email: user.email || '',
                name: user.displayName || user.email?.split('@')[0] || 'User',
                role: isDefaultAdmin ? 'admin' : 'farmer',
                photoUrl: user.photoURL || '',
                location: 'Telangana, India',
                farmingExperience: '4 years',
                skills: 'Organic farming, Drip irrigation, Paddy, Cotton',
                preferredCrops: 'Paddy, Cotton, Maize, Vegetables',
                farmingStatus: 'Ready for lease cultivation',
                numberOfLands: 0,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newProfile);
              if (isDefaultAdmin) {
                await setDoc(doc(db, 'admins', user.uid), {
                  adminId: user.uid,
                  email: user.email,
                  addedAt: new Date().toISOString(),
                });
              }
              setUserProfile(newProfile);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to profile updates in real time if user is logged in
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser?.uid}`);
    });
    return () => unsub();
  }, [currentUser]);

  const loginWithGoogle = async (selectedRole: UserRole = 'farmer') => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      const isSanjay = user.email === 'katrusanjay70@gmail.com';
      const role: UserRole = isSanjay ? 'admin' : selectedRole;
      const newProfile: UserProfile = {
        userId: user.uid,
        email: user.email || '',
        name: user.displayName || 'Google User',
        role,
        photoUrl: user.photoURL || '',
        location: 'AP / Telangana, India',
        farmingExperience: role === 'farmer' ? '3+ Years' : undefined,
        skills: role === 'farmer' ? 'Crop Rotation, Water Management' : undefined,
        preferredCrops: role === 'farmer' ? 'Paddy, Wheat, Pulses' : undefined,
        farmingStatus: role === 'farmer' ? 'Available to work' : undefined,
        numberOfLands: role === 'land_owner' ? 1 : 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      if (role === 'admin' || isSanjay) {
        await setDoc(doc(db, 'admins', user.uid), {
          adminId: user.uid,
          email: user.email,
          addedAt: new Date().toISOString(),
        });
      }
      setUserProfile(newProfile);
    } else {
      setUserProfile(snap.data() as UserProfile);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone?: string,
    location?: string
  ) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    try {
      await fbUpdateProfile(user, { displayName: name });
    } catch (e) {
      // ignore
    }

    const newProfile: UserProfile = {
      userId: user.uid,
      email: user.email || email,
      name,
      role,
      phone: phone || '',
      location: location || 'Hyderabad Rural / Regional Farm Belt',
      farmingExperience: role === 'farmer' ? '3 Years' : undefined,
      skills: role === 'farmer' ? 'Paddy, Cotton, Chillies, Millets' : undefined,
      preferredCrops: role === 'farmer' ? 'Paddy, Groundnut, Maize' : undefined,
      farmingStatus: role === 'farmer' ? 'Active Cultivator' : undefined,
      numberOfLands: role === 'land_owner' ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      if (role === 'admin' || email === 'katrusanjay70@gmail.com') {
        await setDoc(doc(db, 'admins', user.uid), {
          adminId: user.uid,
          email,
          addedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Profile write notice:', err);
    }
    setUserProfile(newProfile);
    setCurrentUser(user);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    setCurrentUser(user);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (e) {
      console.warn('Profile load notice:', e);
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      try {
        sessionStorage.clear();
      } catch (err) {
        // ignore
      }
    }
  };

  const loginAsDemo = (selectedRole: UserRole = 'farmer') => {
    const isSanjay = selectedRole === 'admin';
    const demoProfile: UserProfile = {
      userId: isSanjay ? 'demo_admin_sanjay' : `demo_${selectedRole}_user`,
      email: isSanjay ? 'katrusanjay70@gmail.com' : `demo.${selectedRole}@kethwadi.in`,
      name: isSanjay ? 'Sanjay Katru (Admin Staff)' : selectedRole === 'land_owner' ? 'Ramesh Kumar (Land Owner)' : 'Ravi Varma (Farmer)',
      role: selectedRole,
      location: 'Warangal Rural, Telangana',
      phone: '+91 98765 43210',
      farmingExperience: selectedRole === 'farmer' ? '5 years' : undefined,
      skills: selectedRole === 'farmer' ? 'Organic farming, Drip irrigation, Cotton, Chilli' : undefined,
      preferredCrops: selectedRole === 'farmer' ? 'Bt Cotton, Red Gram, Vegetables' : undefined,
      farmingStatus: selectedRole === 'farmer' ? 'Ready for lease cultivation' : undefined,
      numberOfLands: selectedRole === 'land_owner' ? 2 : 0,
      createdAt: new Date().toISOString(),
    };
    setUserProfile(demoProfile);
    setCurrentUser({
      uid: demoProfile.userId,
      email: demoProfile.email,
      displayName: demoProfile.name,
      emailVerified: true,
      isAnonymous: false,
    } as User);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithGoogle,
        registerWithEmail,
        loginWithEmail,
        logout,
        loginAsDemo,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
