import React, { useState, useEffect } from 'react';
import {
  Sprout,
  MapPin,
  Briefcase,
  Shield,
  Coins,
  Wheat,
  User,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Plus,
  AlertCircle,
  Phone,
  Calendar,
  FileCheck,
  Send,
  Edit3,
  LogOut
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  FarmingWork,
  InsurancePolicy,
  InsuranceApplication,
  LoanApplication,
  SeedSupportRequest,
  LandListing
} from '../types';
import { OFFICIAL_POLICIES, createNotification } from '../services/dbInit';

interface FarmerDashboardProps {
  initialTab?: string;
  onNavigateToLandSearch: () => void;
  onSelectLand: (landId: string) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  initialTab = 'overview',
  onNavigateToLandSearch,
  onSelectLand,
}) => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Data states
  const [farmingWorks, setFarmingWorks] = useState<FarmingWork[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [myInsuranceApps, setMyInsuranceApps] = useState<InsuranceApplication[]>([]);
  const [myLoanApps, setMyLoanApps] = useState<LoanApplication[]>([]);
  const [mySeedRequests, setMySeedRequests] = useState<SeedSupportRequest[]>([]);
  const [recentLands, setRecentLands] = useState<LandListing[]>([]);

  // Modals
  const [selectedPolicyForApply, setSelectedPolicyForApply] = useState<InsurancePolicy | null>(null);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [coverageSelected, setCoverageSelected] = useState('₹2,00,000 Standard Cover');
  const [submittingInsurance, setSubmittingInsurance] = useState(false);

  // Loan modal
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanScheme, setLoanScheme] = useState('Kisan Credit Card (KCC) Crop Loan');
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [loanPurpose, setLoanPurpose] = useState('Seed & Fertilizer Purchase');
  const [loanTenure, setLoanTenure] = useState<number>(12);
  const [submittingLoan, setSubmittingLoan] = useState(false);

  // Seed Support modal
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [seedCrop, setSeedCrop] = useState('Paddy (MTU-1010 Certified)');
  const [seedBags, setSeedBags] = useState<number>(5);
  const [seedSeason, setSeedSeason] = useState<'Kharif (Monsoon)' | 'Rabi (Winter)' | 'Zaid (Summer)'>('Kharif (Monsoon)');
  const [seedAddress, setSeedAddress] = useState(userProfile?.location || '');
  const [submittingSeed, setSubmittingSeed] = useState(false);

  // Farmer Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(userProfile?.name || '');
  const [profilePhone, setProfilePhone] = useState(userProfile?.phone || '');
  const [profileLocation, setProfileLocation] = useState(userProfile?.location || '');
  const [profileExp, setProfileExp] = useState(userProfile?.farmingExperience || '4 Years');
  const [profileSkills, setProfileSkills] = useState(userProfile?.skills || 'Organic Paddy, Drip Irrigation');
  const [profileCrops, setProfileCrops] = useState(userProfile?.preferredCrops || 'Paddy, Cotton, Chillies');
  const [profileStatus, setProfileStatus] = useState(userProfile?.farmingStatus || 'Ready for Cultivation');
  const [savingProfile, setSavingProfile] = useState(false);

  // Toast / feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Sync profile editing fields when userProfile updates
  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || '');
      setProfilePhone(userProfile.phone || '');
      setProfileLocation(userProfile.location || '');
      setProfileExp(userProfile.farmingExperience || '4 Years');
      setProfileSkills(userProfile.skills || 'Organic Paddy, Drip Irrigation');
      setProfileCrops(userProfile.preferredCrops || 'Paddy, Cotton, Chillies');
      setProfileStatus(userProfile.farmingStatus || 'Ready for Cultivation');
    }
  }, [userProfile]);

  // Load real data from Firestore
  useEffect(() => {
    if (!currentUser) return;

    // 1. My Farming Works
    const workQuery = query(
      collection(db, 'farming_works'),
      where('farmerId', '==', currentUser.uid)
    );
    const unsubWork = onSnapshot(workQuery, (snapshot) => {
      const works: FarmingWork[] = [];
      snapshot.forEach((doc) => {
        works.push({ id: doc.id, ...(doc.data() as Omit<FarmingWork, 'id'>) });
      });
      works.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFarmingWorks(works);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'farming_works'));

    // 2. Insurance Policies catalog
    const unsubPolicies = onSnapshot(
      collection(db, 'insurance_policies'),
      (snap) => {
        const pols: InsurancePolicy[] = [];
        snap.forEach((doc) => {
          pols.push({ id: doc.id, ...(doc.data() as Omit<InsurancePolicy, 'id'>) });
        });
        setPolicies(pols.length > 0 ? pols : (OFFICIAL_POLICIES.map((p, i) => ({ id: `off-${i}`, ...p })) as InsurancePolicy[]));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'insurance_policies')
    );

    // 3. My Insurance Applications
    const insAppQuery = query(
      collection(db, 'insurance_applications'),
      where('userId', '==', currentUser.uid)
    );
    const unsubInsApps = onSnapshot(
      insAppQuery,
      (snapshot) => {
        const apps: InsuranceApplication[] = [];
        snapshot.forEach((doc) => {
          apps.push({ id: doc.id, ...(doc.data() as Omit<InsuranceApplication, 'id'>) });
        });
        apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyInsuranceApps(apps);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'insurance_applications')
    );

    // 4. My Loan Applications
    const loanQuery = query(
      collection(db, 'loan_applications'),
      where('userId', '==', currentUser.uid)
    );
    const unsubLoans = onSnapshot(
      loanQuery,
      (snapshot) => {
        const loans: LoanApplication[] = [];
        snapshot.forEach((doc) => {
          loans.push({ id: doc.id, ...(doc.data() as Omit<LoanApplication, 'id'>) });
        });
        loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyLoanApps(loans);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'loan_applications')
    );

    // 5. My Seed Requests
    const seedQuery = query(
      collection(db, 'seed_support_requests'),
      where('userId', '==', currentUser.uid)
    );
    const unsubSeeds = onSnapshot(
      seedQuery,
      (snapshot) => {
        const seeds: SeedSupportRequest[] = [];
        snapshot.forEach((doc) => {
          seeds.push({ id: doc.id, ...(doc.data() as Omit<SeedSupportRequest, 'id'>) });
        });
        seeds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMySeedRequests(seeds);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'seed_support_requests')
    );

    // 6. Recent Farmlands for discovery
    const landsQuery = query(collection(db, 'lands'));
    const unsubLands = onSnapshot(
      landsQuery,
      (snap) => {
        const lands: LandListing[] = [];
        snap.forEach((doc) => {
          lands.push({ id: doc.id, ...(doc.data() as Omit<LandListing, 'id'>) });
        });
        setRecentLands(lands.slice(0, 3));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'lands')
    );

    return () => {
      unsubWork();
      unsubPolicies();
      unsubInsApps();
      unsubLoans();
      unsubSeeds();
      unsubLands();
    };
  }, [currentUser]);

  // Submit Insurance Application
  const handleApplyInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !selectedPolicyForApply) return;
    if (!nomineeName.trim()) {
      showToast('Please provide a nominee name', 'error');
      return;
    }

    setSubmittingInsurance(true);
    try {
      const newApp: Omit<InsuranceApplication, 'id'> = {
        policyId: selectedPolicyForApply.id,
        policyName: selectedPolicyForApply.policyName,
        provider: selectedPolicyForApply.provider,
        userId: currentUser.uid,
        userName: userProfile.name,
        userRole: 'farmer',
        userEmail: currentUser.email || '',
        userPhone: userProfile.phone || '',
        coverageSelected,
        nomineeName: nomineeName.trim(),
        nomineeRelation,
        status: 'submitted',
        notes: 'Submitted via KETHWADI Kisan Protection Gateway. Pending partner underwriting review.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'insurance_applications'), newApp);

      await createNotification(
        currentUser.uid,
        'Insurance Application Received',
        `Your application for ${selectedPolicyForApply.policyName} has been submitted for verification.`,
        'insurance',
        'insurance'
      );

      showToast('Insurance application submitted successfully!');
      setSelectedPolicyForApply(null);
      setNomineeName('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'insurance_applications');
      showToast('Failed to submit application. Please try again.', 'error');
    } finally {
      setSubmittingInsurance(false);
    }
  };

  // Submit Loan Application
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    setSubmittingLoan(true);

    try {
      const newLoan: Omit<LoanApplication, 'id'> = {
        loanSchemeName: loanScheme,
        provider: 'National Bank for Agriculture & Rural Development (NABARD) Partner Banks',
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: currentUser.email || '',
        userPhone: userProfile.phone || '',
        amountRequested: loanAmount,
        purpose: loanPurpose,
        tenureMonths: loanTenure,
        landReference: farmingWorks.length > 0 ? `${farmingWorks[0].landTitle} (${farmingWorks[0].landSize} Acres)` : 'Self / Leased Cultivation',
        status: 'submitted',
        remarks: 'Direct portal submission for agricultural working credit evaluation.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'loan_applications'), newLoan);

      await createNotification(
        currentUser.uid,
        'Loan Inquiry Submitted',
        `Your agricultural loan application for ₹${loanAmount.toLocaleString()} has been queued for institutional review.`,
        'loan',
        'loans'
      );

      showToast('Agricultural loan application submitted successfully!');
      setIsLoanModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'loan_applications');
      showToast('Failed to submit loan application.', 'error');
    } finally {
      setSubmittingLoan(false);
    }
  };

  // Submit Seed Request
  const handleApplySeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    setSubmittingSeed(true);

    try {
      const newSeedReq: Omit<SeedSupportRequest, 'id'> = {
        cropType: seedCrop,
        quantityBags: seedBags,
        season: seedSeason,
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: currentUser.email || '',
        userPhone: userProfile.phone || '',
        deliveryAddress: seedAddress || userProfile.location || 'Local Panchayat Agro Center',
        status: 'submitted',
        notes: 'KETHWADI Subsidized Seed Allocation Scheme request.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'seed_support_requests'), newSeedReq);

      await createNotification(
        currentUser.uid,
        'Seed Support Request Logged',
        `Request for ${seedBags} bags of ${seedCrop} received for ${seedSeason}.`,
        'seed',
        'seed_support'
      );

      showToast('Seed support request submitted successfully!');
      setIsSeedModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'seed_support_requests');
      showToast('Failed to submit seed request.', 'error');
    } finally {
      setSubmittingSeed(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        location: profileLocation.trim(),
        farmingExperience: profileExp.trim(),
        skills: profileSkills.trim(),
        preferredCrops: profileCrops.trim(),
        farmingStatus: profileStatus.trim(),
      });
      showToast('Farmer profile updated successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast message */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold animate-in slide-in-from-bottom duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-900 text-white border border-emerald-700'
              : 'bg-red-900 text-white border border-red-700'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header Profile Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl border-2 border-emerald-500/50 shadow-md">
            {userProfile?.photoUrl ? (
              <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              userProfile?.name?.charAt(0) || 'F'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-800 text-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Farmer Dashboard
              </span>
              <span className="text-xs text-emerald-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {userProfile?.location || 'India'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif mt-1">
              Namaste, {userProfile?.name}
            </h1>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Experience: {userProfile?.farmingExperience || '3+ years'} • Specialization: {userProfile?.preferredCrops || 'Paddy, Pulses, Vegetables'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onNavigateToLandSearch}
            className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs min-h-[40px]"
          >
            <MapPin className="w-4 h-4" />
            <span>Find Available Farmland</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setIsEditingProfile(true);
            }}
            className="w-full sm:w-auto bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-emerald-700 transition flex items-center justify-center gap-2 min-h-[40px]"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-emerald-100 text-xs sm:text-sm font-bold no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Sprout },
          { id: 'farming_work', label: `My Farming Work (${farmingWorks.length})`, icon: Briefcase },
          { id: 'insurance', label: `Life Insurance (${myInsuranceApps.length})`, icon: Shield },
          { id: 'loans', label: `Agricultural Loans (${myLoanApps.length})`, icon: Coins },
          { id: 'seed_support', label: `Seed Support (${mySeedRequests.length})`, icon: Wheat },
          { id: 'profile', label: 'Farmer Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl whitespace-nowrap transition min-h-[42px] ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Active Farming Leases</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950">{farmingWorks.length}</p>
              <span className="text-[11px] text-emerald-700 font-medium">Cultivated Farmlands</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Available Farmlands Nearby</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950">{recentLands.length}+</p>
              <button
                onClick={onNavigateToLandSearch}
                className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                Browse Now <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Life Insurance Status</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950">
                {myInsuranceApps.length > 0 ? myInsuranceApps[0].status.toUpperCase() : 'None'}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">PMJJBY / AIC Protected</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Active Loan / Seed Inquiries</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950">
                {myLoanApps.length + mySeedRequests.length}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">In Process</span>
            </div>
          </div>

          {/* Active Farming Work Preview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  My Active Farming Work
                </h3>
                <p className="text-xs text-gray-500">
                  Farmlands where you are actively cultivating crops
                </p>
              </div>
              <button
                onClick={() => setActiveTab('farming_work')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                View Details ({farmingWorks.length}) <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {farmingWorks.length === 0 ? (
              <div className="bg-emerald-50/50 rounded-2xl p-8 text-center border border-dashed border-emerald-200 space-y-3">
                <Sprout className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">No Active Farming Work Yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Browse available arable lands, view soil & rent details, and join to begin cultivation.
                </p>
                <button
                  onClick={onNavigateToLandSearch}
                  className="bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition"
                >
                  Find Available Farmlands
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {farmingWorks.slice(0, 2).map((work) => (
                  <div
                    key={work.id}
                    className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {work.landLocation}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full capitalize">
                        {work.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base">{work.landTitle}</h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-white p-3 rounded-xl border border-emerald-100/60">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Crop Planted</span>
                        <span className="font-bold text-emerald-900">{work.cropPlanted}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Size & Rent</span>
                        <span className="font-semibold text-gray-800">{work.landSize} Ac • ₹{work.landRent.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
                      <span>Landowner: <strong>{work.ownerName}</strong></span>
                      <span>Started: {work.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Land Discovery Teaser */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Available Farmlands Ready for Lease
                </h3>
                <p className="text-xs text-gray-500">
                  Recent fertile listings uploaded by landowners
                </p>
              </div>
              <button
                onClick={onNavigateToLandSearch}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Search All Farmlands <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentLands.map((land) => (
                <div
                  key={land.id}
                  onClick={() => onSelectLand(land.id)}
                  className="p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-xs transition cursor-pointer bg-white group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-2">
                      <img
                        src={land.photos?.[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-2 left-2 bg-emerald-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {land.sizeAcres} Acres
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-emerald-800">
                      {land.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{land.location}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-2">
                    <span className="font-bold text-emerald-900">₹{land.rentAmount.toLocaleString()}/{land.rentPeriod}</span>
                    <span className="text-emerald-700 font-semibold">Join & Cultivate →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY FARMING WORK */}
      {activeTab === 'farming_work' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 font-serif">
                My Active Farming Work & Leased Farmlands
              </h2>
              <p className="text-xs text-gray-500">
                All farmlands where you have partnered to cultivate crops.
              </p>
            </div>
            <button
              onClick={onNavigateToLandSearch}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Join Another Farmland
            </button>
          </div>

          {farmingWorks.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Briefcase className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No Active Farming Work Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Explore available farmlands on KETHWADI, inspect soil and water sources, and select 'Join as Farmer' on any land.
              </p>
              <button
                onClick={onNavigateToLandSearch}
                className="mt-2 bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition"
              >
                Explore Farmlands Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {farmingWorks.map((work) => (
                <div
                  key={work.id}
                  className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {work.landLocation}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">{work.landTitle}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      work.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {work.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3.5 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Cultivating Crop:</span>
                      <span className="font-bold text-emerald-950 text-sm flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                        {work.cropPlanted}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Farmland Size:</span>
                      <span className="font-bold text-emerald-950 text-sm">{work.landSize} Acres</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Rent Agreed:</span>
                      <span className="font-semibold text-gray-800">₹{work.landRent.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Start Date:</span>
                      <span className="font-semibold text-gray-800">{work.startDate}</span>
                    </div>
                  </div>

                  {work.notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="font-semibold text-gray-700 block mb-0.5">Agreement / Notes:</span>
                      {work.notes}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 block">Farmland Owner:</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        {work.ownerName}
                      </span>
                      {work.ownerPhone && (
                        <span className="text-gray-500 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600" /> {work.ownerPhone}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectLand(work.landId)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg transition"
                    >
                      View Land Listing →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIFE INSURANCE */}
      {activeTab === 'insurance' && (
        <div className="space-y-8">
          {/* Regulatory Disclaimer Header */}
          <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Authorized Life Insurance Schemes
              </div>
              <h2 className="text-2xl font-black font-serif">Kisan & Farmland Life Protection</h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl">
                KETHWADI facilitates seamless applications to official life insurance programs underwritten by authorized insurers such as LIC of India and Agriculture Insurance Company of India (AIC).
              </p>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-700/60 p-3 rounded-2xl text-[11px] text-emerald-300 shrink-0">
              ✓ Subsidized Government Schemes<br />
              ✓ Direct Bank Debit Enrollment
            </div>
          </div>

          {/* My Submitted Applications */}
          {myInsuranceApps.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 font-serif">
                My Insurance Applications ({myInsuranceApps.length})
              </h3>
              <div className="space-y-3">
                {myInsuranceApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{app.policyName}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">
                        Provider: {app.provider} • Nominee: <strong>{app.nomineeName}</strong> ({app.nomineeRelation})
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Applied on: {new Date(app.createdAt).toLocaleDateString()} • {app.notes}
                      </p>
                    </div>
                    <div className="text-right sm:text-right shrink-0">
                      <span className="text-xs font-black text-emerald-950 block">{app.coverageSelected}</span>
                      <span className="text-[10px] text-emerald-700">Official Partner Processing</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Policies Catalog */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-emerald-950 font-serif">
              Available Life Insurance Policies & Schemes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {policy.providerType}
                      </span>
                      {policy.statusBadge && (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          {policy.statusBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-gray-900 leading-snug">
                      {policy.policyName}
                    </h4>

                    <div className="p-3 bg-emerald-50/60 rounded-xl space-y-1">
                      <div className="text-[10px] text-gray-500">Life Coverage:</div>
                      <div className="text-base font-black text-emerald-950">{policy.coverage}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Premium: {policy.premiumInfo}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <span className="font-semibold text-gray-800 block text-[11px]">Eligibility:</span>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{policy.eligibility}</p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="font-semibold text-gray-800 block text-[11px]">Key Highlights:</span>
                      <ul className="space-y-1 text-[11px] text-gray-600">
                        {policy.keyBenefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedPolicyForApply(policy)}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Apply for Policy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOANS */}
      {activeTab === 'loans' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-amber-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Coins className="w-4 h-4" /> Agricultural Credit & Loan Facilitation
              </div>
              <h2 className="text-2xl font-black font-serif">Kisan Agricultural Loans & Credit</h2>
              <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl">
                Access low-interest crop loans, Kisan Credit Cards (KCC), and mechanization loans through authorized public and rural banking partners.
              </p>
            </div>
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition shrink-0 shadow-md"
            >
              + Submit Loan Inquiry
            </button>
          </div>

          {/* My Submitted Loans */}
          {myLoanApps.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 font-serif">
                My Loan Applications ({myLoanApps.length})
              </h3>
              <div className="space-y-3">
                {myLoanApps.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{loan.loanSchemeName}</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        Amount: <strong className="text-gray-900">₹{loan.amountRequested.toLocaleString()}</strong> • Purpose: {loan.purpose} • Tenure: {loan.tenureMonths} Months
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Submitted: {new Date(loan.createdAt).toLocaleDateString()} • {loan.remarks}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Lending Partner: NABARD / Commercial Banks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Schemes Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Most Popular</span>
              <h3 className="text-lg font-bold text-gray-900">Kisan Credit Card (KCC)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Short-term crop cultivation loan up to ₹3,00,000 at effective 4% interest rate with 3% prompt repayment subvention.
              </p>
              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li>• Flexible withdrawal limit as per crop seasons</li>
                <li>• No collateral required up to ₹1.60 Lakh</li>
                <li>• Simple documentation via land lease proof</li>
              </ul>
              <button
                onClick={() => {
                  setLoanScheme('Kisan Credit Card (KCC) Crop Loan');
                  setIsLoanModalOpen(true);
                }}
                className="w-full mt-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold py-2 rounded-xl text-xs transition"
              >
                Apply for KCC
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Equipment</span>
              <h3 className="text-lg font-bold text-gray-900">Farm Mechanization Loan</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Purchase tractors, rotavators, drip irrigation equipment, and harvest machinery with up to 7-year repayment tenures.
              </p>
              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li>• Subsidies under SMAM schemes</li>
                <li>• Financing up to 85% of machinery invoice</li>
                <li>• Flexible semi-annual EMI after harvest</li>
              </ul>
              <button
                onClick={() => {
                  setLoanScheme('Farm Mechanization & Equipment Finance');
                  setIsLoanModalOpen(true);
                }}
                className="w-full mt-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold py-2 rounded-xl text-xs transition"
              >
                Inquire Machinery Loan
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Working Capital</span>
              <h3 className="text-lg font-bold text-gray-900">Seasonal Crop Input Credit</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Emergency financial buffer for purchasing certified seeds, organic fertilizers, and labor costs during sowing months.
              </p>
              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li>• Fast review within 5 working days</li>
                <li>• Direct disbursement to registered bank account</li>
                <li>• Bullet repayment at end of crop harvesting cycle</li>
              </ul>
              <button
                onClick={() => {
                  setLoanScheme('Seasonal Crop Input Credit');
                  setIsLoanModalOpen(true);
                }}
                className="w-full mt-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold py-2 rounded-xl text-xs transition"
              >
                Apply Crop Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEED SUPPORT */}
      {activeTab === 'seed_support' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <Wheat className="w-4 h-4" /> Certified High-Yield Seeds
              </div>
              <h2 className="text-2xl font-black font-serif">Kisan Certified Seed Support</h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl">
                Request verified high-germination certified seed varieties co-allocated with National Seeds Corporation (NSC) and state agriculture universities.
              </p>
            </div>
            <button
              onClick={() => setIsSeedModalOpen(true)}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition shrink-0 shadow-md"
            >
              + Request Seed Allocation
            </button>
          </div>

          {/* My Seed Requests */}
          {mySeedRequests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 font-serif">
                My Seed Support Requests ({mySeedRequests.length})
              </h3>
              <div className="space-y-3">
                {mySeedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{req.cropType}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        Quantity: <strong>{req.quantityBags} Bags</strong> • Season: {req.season}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Delivery Hub: {req.deliveryAddress} • Requested on: {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Agro Cooperative Dispatch Hub
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seeds Varieties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3">
              <span className="text-xs font-bold text-emerald-700 uppercase">Kharif Season</span>
              <h3 className="text-base font-bold text-gray-900">Paddy MTU-1010 & BPT-5204</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Short and medium duration fine-grain paddy seed with blast resistance and high grain density.
              </p>
              <div className="text-xs text-gray-600">Germination Rate: <strong>92%+</strong></div>
              <button
                onClick={() => {
                  setSeedCrop('Paddy (MTU-1010 Certified)');
                  setIsSeedModalOpen(true);
                }}
                className="w-full bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs hover:bg-emerald-800 transition"
              >
                Request Paddy Seeds
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3">
              <span className="text-xs font-bold text-amber-700 uppercase">Cash Crop</span>
              <h3 className="text-base font-bold text-gray-900">Bt Cotton Hybrid RCH-2</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Bollworm-resistant hybrid cotton seeds for black and deep loamy soil varieties.
              </p>
              <div className="text-xs text-gray-600">Germination Rate: <strong>88%+</strong></div>
              <button
                onClick={() => {
                  setSeedCrop('Bt Cotton Hybrid RCH-2');
                  setIsSeedModalOpen(true);
                }}
                className="w-full bg-amber-600 text-white font-bold py-2 rounded-xl text-xs hover:bg-amber-700 transition"
              >
                Request Cotton Seeds
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3">
              <span className="text-xs font-bold text-cyan-700 uppercase">Rabi Season</span>
              <h3 className="text-base font-bold text-gray-900">Wheat HD-2967 / Gram Pulses</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                High-yield certified winter crop seeds with drought endurance and superior milling quality.
              </p>
              <div className="text-xs text-gray-600">Germination Rate: <strong>90%+</strong></div>
              <button
                onClick={() => {
                  setSeedCrop('Wheat HD-2967 Certified');
                  setIsSeedModalOpen(true);
                }}
                className="w-full bg-cyan-700 text-white font-bold py-2 rounded-xl text-xs hover:bg-cyan-800 transition"
              >
                Request Wheat Seeds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 font-serif">
                Farmer Profile & Agricultural Record
              </h3>
              <p className="text-xs text-gray-500">
                Landowners review these details when confirming cultivation partnerships.
              </p>
            </div>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl transition"
              >
                Edit Details
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Location / District</label>
                  <input
                    type="text"
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Farming Experience</label>
                  <input
                    type="text"
                    value={profileExp}
                    onChange={(e) => setProfileExp(e.target.value)}
                    placeholder="e.g. 5 Years in Paddy & Cotton"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Cultivation Status</label>
                  <select
                    value={profileStatus}
                    onChange={(e) => setProfileStatus(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Ready for Cultivation">Ready for Cultivation</option>
                    <option value="Currently Engaged">Currently Engaged</option>
                    <option value="Seeking Next Season Land">Seeking Next Season Land</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Farming Skills & Equipment Experience</label>
                <input
                  type="text"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="e.g. Drip irrigation, Tractor operator, Soil mulching"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Preferred Crops</label>
                <input
                  type="text"
                  value={profileCrops}
                  onChange={(e) => setProfileCrops(e.target.value)}
                  placeholder="e.g. Paddy, Cotton, Soybean, Pulses"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 shadow-xs"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-2xl">
                <div>
                  <span className="text-gray-400 block text-[10px]">Name</span>
                  <span className="font-bold text-gray-900 text-sm">{userProfile?.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Email</span>
                  <span className="font-medium text-gray-800">{userProfile?.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Phone</span>
                  <span className="font-semibold text-gray-800">{userProfile?.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Location</span>
                  <span className="font-semibold text-gray-800">{userProfile?.location || 'India'}</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-3">
                <div>
                  <span className="text-gray-400 block text-[10px]">Farming Experience</span>
                  <span className="font-bold text-emerald-950 text-sm">{userProfile?.farmingExperience || '4 Years'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Specialized Skills</span>
                  <span className="font-medium text-gray-800">{userProfile?.skills || 'Organic Farming, Drip Irrigation'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Preferred Crops</span>
                  <span className="font-medium text-gray-800">{userProfile?.preferredCrops || 'Paddy, Cotton, Maize'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Current Status</span>
                  <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                    {userProfile?.farmingStatus || 'Ready for Cultivation'}
                  </span>
                </div>
              </div>

              {/* Session / Logout Box */}
              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Account Session</h4>
                  <p className="text-xs text-gray-500">Log out of your Farmer account on this device.</p>
                </div>
                <button
                  onClick={async () => {
                    setIsSigningOut(true);
                    try {
                      await logout();
                    } finally {
                      setIsSigningOut(false);
                    }
                  }}
                  disabled={isSigningOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Apply for Insurance */}
      {selectedPolicyForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100">
            <form onSubmit={handleApplyInsurance} className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Official Policy Application
                </div>
                <h3 className="text-lg font-black text-gray-900 font-serif">
                  {selectedPolicyForApply.policyName}
                </h3>
                <p className="text-xs text-gray-500">
                  Provider: {selectedPolicyForApply.provider}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Coverage:</span>
                  <strong className="text-emerald-950">{selectedPolicyForApply.coverage}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Annual Premium:</span>
                  <strong className="text-emerald-800">{selectedPolicyForApply.premiumInfo}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Nominee Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  placeholder="e.g. Sunita Devi"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Relationship to Nominee
                  </label>
                  <select
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Coverage Plan
                  </label>
                  <select
                    value={coverageSelected}
                    onChange={(e) => setCoverageSelected(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="₹2,00,000 Standard Cover">₹2,00,000 Standard</option>
                    <option value="₹5,00,000 Enhanced Cover">₹5,00,000 Enhanced</option>
                    <option value="₹10,00,000 Maximum Cover">₹10,00,000 Maximum</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                Notice: KETHWADI securely routes your enrollment details to the registered insurance partner for paperless verification.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedPolicyForApply(null)}
                  disabled={submittingInsurance}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInsurance}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-xs flex items-center gap-2"
                >
                  {submittingInsurance && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit Loan Application */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100">
            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Agricultural Credit Request
                </div>
                <h3 className="text-lg font-black text-gray-900 font-serif">
                  Apply for Agricultural Credit
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Loan Scheme
                </label>
                <select
                  value={loanScheme}
                  onChange={(e) => setLoanScheme(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Kisan Credit Card (KCC) Crop Loan">Kisan Credit Card (KCC) Crop Loan</option>
                  <option value="Farm Mechanization & Equipment Finance">Farm Mechanization & Equipment Finance</option>
                  <option value="Seasonal Crop Input Credit">Seasonal Crop Input Credit</option>
                  <option value="Solar Pump / Micro-Irrigation Loan">Solar Pump / Micro-Irrigation Loan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    max="1000000"
                    step="5000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tenure (Months)
                  </label>
                  <select
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value={6}>6 Months (Single Season)</option>
                    <option value={12}>12 Months (Annual KCC)</option>
                    <option value={24}>24 Months</option>
                    <option value={60}>60 Months (Equipment)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Primary Purpose
                </label>
                <input
                  type="text"
                  required
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="e.g. Sowing costs for Paddy, purchasing Drip line"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  disabled={submittingLoan}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLoan}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-xs flex items-center gap-2"
                >
                  {submittingLoan && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Submit Loan Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Seed Support */}
      {isSeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100">
            <form onSubmit={handleApplySeed} className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Subsidized Seed Allocation
                </div>
                <h3 className="text-lg font-black text-gray-900 font-serif">
                  Request Certified High-Yield Seeds
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Seed Variety
                </label>
                <select
                  value={seedCrop}
                  onChange={(e) => setSeedCrop(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Paddy (MTU-1010 Certified)">Paddy (MTU-1010 Certified)</option>
                  <option value="Paddy BPT-5204 (Samba Masuri)">Paddy BPT-5204 (Samba Masuri)</option>
                  <option value="Bt Cotton Hybrid RCH-2">Bt Cotton Hybrid RCH-2</option>
                  <option value="Wheat HD-2967 Certified">Wheat HD-2967 Certified</option>
                  <option value="Chickpea / Bengal Gram JG-11">Chickpea / Bengal Gram JG-11</option>
                  <option value="Soybean JS-335">Soybean JS-335</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Quantity (Bags)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={seedBags}
                    onChange={(e) => setSeedBags(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Season
                  </label>
                  <select
                    value={seedSeason}
                    onChange={(e) => setSeedSeason(e.target.value as any)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Kharif (Monsoon)">Kharif (Monsoon)</option>
                    <option value="Rabi (Winter)">Rabi (Winter)</option>
                    <option value="Zaid (Summer)">Zaid (Summer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Delivery / Pickup Location
                </label>
                <input
                  type="text"
                  required
                  value={seedAddress}
                  onChange={(e) => setSeedAddress(e.target.value)}
                  placeholder="Village / Nearest Panchayat Seed Depot"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSeedModalOpen(false)}
                  disabled={submittingSeed}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSeed}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-xs flex items-center gap-2"
                >
                  {submittingSeed && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Confirm Seed Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
