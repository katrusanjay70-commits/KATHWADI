/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { FindLandPage } from './pages/FindLandPage';
import { LandDetailsPage } from './pages/LandDetailsPage';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { LandOwnerDashboard } from './pages/LandOwnerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { LandListing, UserRole } from './types';
import { purgeFakeDataFromDatabase } from './services/seedFarmlands';

function MainApp() {
  const { currentUser, userProfile, loading, logout } = useAuth();

  // Navigation state
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedLandId, setSelectedLandId] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin' | null>(null);

  // Farmlands live cache
  const [allLands, setAllLands] = useState<LandListing[]>([]);

  // Purge any residual fake data from database on mount
  useEffect(() => {
    purgeFakeDataFromDatabase();
  }, []);

  // Listen to lands collection in real-time
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        collection(db, 'lands'),
        (snap) => {
          const lands: LandListing[] = [];
          snap.forEach((doc) => {
            lands.push({ id: doc.id, ...(doc.data() as Omit<LandListing, 'id'>) });
          });
          lands.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setAllLands(lands);
        },
        (error) => {
          setAllLands([]);
          try {
            handleFirestoreError(error, OperationType.GET, 'lands');
          } catch (e) {
            console.warn('Operating lands notice:', e);
          }
        }
      );
    } catch (err) {
      setAllLands([]);
    }
    return () => unsub();
  }, []);

  // When user logs out, immediately return to landing page
  useEffect(() => {
    if (!loading && !currentUser) {
      const protectedPages = [
        'admin_dashboard',
        'farmer_dashboard',
        'landowner_dashboard',
        'farming_work',
        'my_lands',
        'add_land',
        'landowner_farmers',
        'profile',
        'loans',
        'seed_support',
      ];
      if (protectedPages.includes(currentPage)) {
        setCurrentPage('landing');
      }
    }
  }, [currentUser, loading, currentPage]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setCurrentPage('landing');
      setSelectedLandId(null);
      setAuthModalMode(null);
    }
  };

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'admin_login') {
      if (currentUser && (userProfile?.role === 'admin' || currentUser.email === 'katrusanjay70@gmail.com')) {
        setCurrentPage('admin_dashboard');
      } else {
        setAuthModalMode('admin');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (params?.landId) {
      setSelectedLandId(params.landId);
      setCurrentPage('land_details');
    } else {
      setCurrentPage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLand = (landId: string) => {
    setSelectedLandId(landId);
    setCurrentPage('land_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (role: UserRole) => {
    setAuthModalMode(null);
    if (role === 'admin' || userProfile?.role === 'admin' || currentUser?.email === 'katrusanjay70@gmail.com') {
      setCurrentPage('admin_dashboard');
    } else if (role === 'land_owner' || userProfile?.role === 'land_owner') {
      setCurrentPage('landowner_dashboard');
    } else {
      setCurrentPage('farmer_dashboard');
    }
  };

  // Disabled Account Guard
  if (currentUser && userProfile?.isDisabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-2xl font-black text-gray-900 font-serif">Account Suspended</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your KETHWADI account has been deactivated by the platform administration. Please contact staff support at <strong>support@kethwadi.in</strong> or phone 1800-180-1551.
          </p>
          <button
            onClick={() => logout()}
            className="w-full bg-red-700 text-white font-bold py-3 rounded-xl text-xs hover:bg-red-800 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Role guarding
  const isFarmer = userProfile?.role === 'farmer';
  const isLandOwner = userProfile?.role === 'land_owner';
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'katrusanjay70@gmail.com';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-950 font-bold font-serif text-lg">Loading KETHWADI Platform...</p>
        </div>
      );
    }

    // Auth screen if modal open
    if (authModalMode) {
      return (
        <AuthPage
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
          onCancel={() => setAuthModalMode(null)}
        />
      );
    }

    // Land Details dedicated page
    if (currentPage === 'land_details' && selectedLandId) {
      return (
        <LandDetailsPage
          landId={selectedLandId}
          onBack={() => setCurrentPage(currentUser && isFarmer ? 'farmer_dashboard' : 'find_land')}
          onNavigateToWork={() => setCurrentPage('farming_work')}
          onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
          onEditLand={(landId) => {
            setSelectedLandId(landId);
            setCurrentPage('landowner_dashboard');
          }}
        />
      );
    }

    // Find Land search page
    if (currentPage === 'find_land') {
      return (
        <FindLandPage
          onSelectLand={handleSelectLand}
          onAddLand={() => setCurrentPage('add_land')}
          userRole={userProfile?.role}
        />
      );
    }

    // Farmer Dashboard & related tabs
    if (
      currentPage === 'farmer_dashboard' ||
      currentPage === 'farming_work' ||
      (currentPage === 'insurance' && isFarmer) ||
      currentPage === 'loans' ||
      currentPage === 'seed_support' ||
      (currentPage === 'profile' && isFarmer)
    ) {
      if (!currentUser) {
        return (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
            featuredLands={allLands}
          />
        );
      }

      // Role protection: if signed in as landowner, redirect to landowner dashboard
      if (isLandOwner && !isAdmin) {
        return (
          <LandOwnerDashboard
            initialTab="my_lands"
            onSelectLand={handleSelectLand}
          />
        );
      }

      let subTab = 'overview';
      if (currentPage === 'farming_work') subTab = 'farming_work';
      else if (currentPage === 'insurance') subTab = 'insurance';
      else if (currentPage === 'loans') subTab = 'loans';
      else if (currentPage === 'seed_support') subTab = 'seed_support';
      else if (currentPage === 'profile') subTab = 'profile';

      return (
        <FarmerDashboard
          key={subTab}
          initialTab={subTab}
          onNavigateToLandSearch={() => setCurrentPage('find_land')}
          onSelectLand={handleSelectLand}
        />
      );
    }

    // Land Owner Dashboard & related tabs
    if (
      currentPage === 'landowner_dashboard' ||
      currentPage === 'my_lands' ||
      currentPage === 'add_land' ||
      currentPage === 'landowner_farmers' ||
      (currentPage === 'insurance' && isLandOwner) ||
      (currentPage === 'profile' && isLandOwner)
    ) {
      if (!currentUser) {
        return (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
            featuredLands={allLands}
          />
        );
      }

      // Role protection: if signed in as farmer, redirect to farmer dashboard
      if (isFarmer && !isAdmin) {
        return (
          <FarmerDashboard
            initialTab="overview"
            onNavigateToLandSearch={() => setCurrentPage('find_land')}
            onSelectLand={handleSelectLand}
          />
        );
      }

      let subTab = 'my_lands';
      if (currentPage === 'add_land') subTab = 'add_land';
      else if (currentPage === 'landowner_farmers') subTab = 'working_farmers';
      else if (currentPage === 'insurance') subTab = 'insurance';
      else if (currentPage === 'profile') subTab = 'profile';

      return (
        <LandOwnerDashboard
          key={subTab}
          initialTab={subTab}
          onSelectLand={handleSelectLand}
        />
      );
    }

    // Admin Dashboard
    if (currentPage === 'admin_dashboard') {
      if (!currentUser || !isAdmin) {
        return (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'admin')}
            featuredLands={allLands}
          />
        );
      }

      return (
        <AdminDashboard
          onSelectLand={handleSelectLand}
          onNavigateHome={() => setCurrentPage('landing')}
        />
      );
    }

    // Default: Public Landing Page
    return (
      <LandingPage
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
        featuredLands={allLands}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfdfa] text-gray-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Hide public Navbar/Footer when in full Admin Dashboard workspace */}
      {currentPage !== 'admin_dashboard' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
        />
      )}

      <main className="flex-1">
        {renderContent()}
      </main>

      {currentPage !== 'admin_dashboard' && (
        <Footer onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
