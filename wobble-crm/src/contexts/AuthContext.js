import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userData = userDoc.exists() ? userDoc.data() : { role: 'callcenter', name: user.email };
                    setUser({ ...user, ...userData });
                    setRole(userData?.role || 'callcenter');
                } catch (error) {
                    setUser(user);
                    setRole('callcenter');
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', result.user.uid));
            let userRole = 'callcenter';
            let userName = result.user.email;
            if (userDoc.exists()) {
                userRole = userDoc.data().role;
                userName = userDoc.data().name || userName;
            }
            toast.success(`Welcome ${userName}`);
            return { success: true, role: userRole };
        } catch (error) {
            toast.error(error.message);
            return { success: false };
        }
    };

    const logout = async () => {
        await signOut(auth);
        toast.success('Logged out');
    };

    const value = { user, role, login, logout, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}