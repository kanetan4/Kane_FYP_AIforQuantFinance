import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { AuthContext } from "../context/AuthContext";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch additional user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid); // Reference to Firestore document
      const userSnap = await getDoc(userRef); // Fetch user document
      if (userSnap.exists()) {
        return userSnap.data(); // Return user data if it exists
      } else {
        console.error("User not found in Firestore");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // Monitor authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userData = await fetchUserData(firebaseUser.uid);
        setUserData(userData);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth); // Sign out the user
      setUser(null);
      setUserData(null); // Clear user data
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};