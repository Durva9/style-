import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AddItem from "./AddItem";
import Wardrobe from "./Wardrobe";
import Profile from "./Profile";
import Analysis from "./Analysis";
import Settings from "./Settings";
import OutfitRecommendation from "./OutfitRecommendation";
import SavedOutfits from "./SavedOutfits";
import FitAdvisor from "./FitAdvisor";
import FitRanking from "./FitRanking";
import WardrobeAnalytics from "./WardrobeAnalytics";
import VirtualTryOn from "./VirtualTryOn";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      {!user && (
        <nav style={{ textAlign: "center", margin: "20px" }}>
          <Link to="/signup" style={{ marginRight: "15px" }}>Sign Up</Link>
          <Link to="/login">Login</Link>
        </nav>
      )}

      <Routes>
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to={justSignedUp ? "/onboarding/profile" : "/dashboard"} />
            ) : (
              <Signup onSignupSuccess={() => setJustSignedUp(true)} />
            )
          }
        />

<Route
  path="/saved-outfits"
  element={user ? <SavedOutfits user={user} /> : <Navigate to="/login" />}
/>

<Route
  path="/fit-ranking"
  element={user ? <FitRanking user={user} /> : <Navigate to="/login" />}
/>

<Route
  path="/fit-advisor"
  element={user ? <FitAdvisor user={user} /> : <Navigate to="/login" />}
/>

        <Route
  path="/recommend"
  element={user ? <OutfitRecommendation user={user} /> : <Navigate to="/login" />}
/>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
  path="/analytics"
  element={user ? <WardrobeAnalytics user={user} /> : <Navigate to="/login" />}
/>

<Route
  path="/try-on"
  element={user ? <VirtualTryOn user={user} /> : <Navigate to="/login" />}
/>

<Route
  path="/outfit-suggestion"
  element={<Navigate to="/recommend" />}
/>
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/add-item"
          element={user ? <AddItem user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/wardrobe"
          element={user ? <Wardrobe user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />}
        />

        <Route
          path="/profile"
          element={user ? <Profile user={user} onboarding={false} /> : <Navigate to="/login" />}
        />
        <Route
          path="/analysis"
          element={user ? <Analysis user={user} onboarding={false} /> : <Navigate to="/login" />}
        />

        <Route
          path="/onboarding/profile"
          element={user ? <Profile user={user} onboarding={true} /> : <Navigate to="/login" />}
        />
        <Route
          path="/onboarding/analysis"
          element={user ? <Analysis user={user} onboarding={true} /> : <Navigate to="/login" />}
        />

        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;