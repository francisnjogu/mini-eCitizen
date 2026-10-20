import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsAdmin: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  signInWithGoogleAuth: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (name: string, phone?: string) => Promise<void>;
  changeAccountPassword: (newPass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_EMAIL = 'francisnjogu157@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Determine admin status based on email or profile role
  const isAdmin = Boolean(
    user && (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || profile?.role === 'admin')
  );

  const fetchProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
      } else {
        // Auto-provision initial profile record
        const isDefaultAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const initialRole: UserRole = isDefaultAdmin ? 'admin' : 'citizen';
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || (isDefaultAdmin ? 'Admin Francis' : 'Citizen User'),
          email: firebaseUser.email || (isDefaultAdmin ? ADMIN_EMAIL : 'citizen@demo.local'),
          phone: '',
          role: initialRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);

          // If admin, also populate admins collection
          if (initialRole === 'admin') {
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              addedAt: new Date().toISOString(),
            });
          }
        } catch (setErr) {
          console.warn('Could not save user profile to Firestore:', setErr);
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.warn('Error fetching user profile:', err);
      // Fallback local representation to avoid locking out user
      const isDefaultAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      setProfile({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || (isDefaultAdmin ? 'Admin Francis' : 'Citizen User'),
        email: firebaseUser.email || (isDefaultAdmin ? ADMIN_EMAIL : 'citizen@demo.local'),
        role: isDefaultAdmin ? 'admin' : 'citizen',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    await fetchProfile(cred.user);
  };

  const signInAsAdmin = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Please enter the administrator email address.');
    }

    if (!pass || pass.length < 6) {
      throw new Error('Please enter a valid administrator password (at least 6 characters).');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      
      // Verify admin authorization: matches default admin email or is registered in admins/roles
      const isDesignatedAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
      let hasAdminPrivilege = isDesignatedAdmin;

      if (!hasAdminPrivilege) {
        try {
          const adminDocSnap = await getDoc(doc(db, 'admins', cred.user.uid));
          if (adminDocSnap.exists()) {
            hasAdminPrivilege = true;
          } else {
            const userDocSnap = await getDoc(doc(db, 'users', cred.user.uid));
            if (userDocSnap.exists() && (userDocSnap.data() as UserProfile).role === 'admin') {
              hasAdminPrivilege = true;
            }
          }
        } catch {
          // If firestore read fails, fallback to email match
          hasAdminPrivilege = isDesignatedAdmin;
        }
      }

      if (!hasAdminPrivilege) {
        await signOut(auth);
        throw new Error(`Account "${cleanEmail}" is not authorized as an administrator.`);
      }

      // Ensure admin document and last login are saved
      try {
        const adminDocRef = doc(db, 'admins', cred.user.uid);
        await setDoc(adminDocRef, {
          uid: cred.user.uid,
          email: cleanEmail,
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn('Could not update admin login record:', err);
      }

      await fetchProfile(cred.user);
    } catch (err: any) {
      // If user account is not found in Firebase Auth yet and is designated admin, auto-create
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
        cleanEmail === ADMIN_EMAIL.toLowerCase()
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          const adminName = 'Admin Francis Njogu';
          await fbUpdateProfile(cred.user, { displayName: adminName });

          const newProfile: UserProfile = {
            uid: cred.user.uid,
            name: adminName,
            email: ADMIN_EMAIL,
            phone: '+254 700 123456',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
          await setDoc(doc(db, 'admins', cred.user.uid), {
            uid: cred.user.uid,
            email: ADMIN_EMAIL,
            addedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          });

          setProfile(newProfile);
          return;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            throw new Error('Incorrect password for administrator account. Please check your password or reset it.');
          }
          throw createErr;
        }
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string = '') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (cleanName) {
      try {
        await fbUpdateProfile(cred.user, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Could not update Firebase user displayName:', profileErr);
      }
    }

    const isDefaultAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: cleanName || 'Citizen User',
      email: cleanEmail,
      phone: cleanPhone,
      role: isDefaultAdmin ? 'admin' : 'citizen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      if (isDefaultAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          uid: cred.user.uid,
          email: cleanEmail,
          addedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${cred.user.uid}`);
    }

    setProfile(newProfile);
  };

  const signInWithGoogleAuth = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await fetchProfile(cred.user);
  };

  // Quick Demo Login allows immediate evaluation of Citizen & Admin workflows in AI Studio
  const quickDemoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      const demoEmail = role === 'admin' ? ADMIN_EMAIL : 'citizen.demo@miniecitizen.org';
      const demoPassword = 'DemoPassword123!';

      try {
        const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        await fetchProfile(cred.user);
      } catch (err: any) {
        // Try creating the account if it didn't exist yet
        try {
          const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          const demoName = role === 'admin' ? 'Admin Francis Njogu' : 'Jane Citizen';
          await fbUpdateProfile(cred.user, { displayName: demoName });

          const newProfile: UserProfile = {
            uid: cred.user.uid,
            name: demoName,
            email: demoEmail,
            phone: '+254 700 123456',
            role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
          if (role === 'admin') {
            await setDoc(doc(db, 'admins', cred.user.uid), {
              uid: cred.user.uid,
              email: demoEmail,
              addedAt: new Date().toISOString(),
            });
          }
          setProfile(newProfile);
        } catch {
          // If creation fails due to operation-not-allowed, fallback to anonymous session with simulated demo profile
          const anonCred = await signInAnonymously(auth);
          const demoName = role === 'admin' ? 'Admin Francis Njogu' : 'Jane Citizen';
          const mockProfile: UserProfile = {
            uid: anonCred.user.uid,
            name: demoName,
            email: demoEmail,
            phone: '+254 700 123456',
            role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProfile(mockProfile);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateProfileData = async (name: string, phone: string = '') => {
    if (!user) throw new Error('Not logged in');

    if (name !== user.displayName) {
      await fbUpdateProfile(user, { displayName: name });
    }

    const updatedData: Partial<UserProfile> = {
      name,
      phone,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), updatedData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }

    setProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const changeAccountPassword = async (newPass: string) => {
    if (!user) throw new Error('Not logged in');
    await fbUpdatePassword(user, newPass);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signInWithEmail,
        signInAsAdmin,
        signUpWithEmail,
        signInWithGoogleAuth,
        quickDemoLogin,
        resetPassword,
        updateProfileData,
        changeAccountPassword,
        logout,
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
