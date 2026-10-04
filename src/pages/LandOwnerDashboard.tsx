import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Briefcase,
  Shield,
  User,
  MapPin,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Calendar,
  X,
  Plus,
  DollarSign,
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
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { LandListing, FarmingWork, InsurancePolicy, InsuranceApplication } from '../types';
import { ImageUpload } from '../components/ImageUpload';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { OFFICIAL_POLICIES, createNotification } from '../services/dbInit';

interface LandOwnerDashboardProps {
  initialTab?: string;
  onSelectLand: (landId: string) => void;
}

export const LandOwnerDashboard: React.FC<LandOwnerDashboardProps> = ({
  initialTab = 'my_lands',
  onSelectLand,
}) => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Data states
  const [myLands, setMyLands] = useState<LandListing[]>([]);
  const [workingFarmers, setWorkingFarmers] = useState<FarmingWork[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [myInsuranceApps, setMyInsuranceApps] = useState<InsuranceApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Land Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState(userProfile?.location || 'Hyderabad Rural, Telangana');
  const [sizeAcres, setSizeAcres] = useState<number>(5);
  const [rentAmount, setRentAmount] = useState<number>(25000);
  const [rentPeriod, setRentPeriod] = useState<'month' | 'year' | 'season'>('year');
  const [soilType, setSoilType] = useState<LandListing['soilType']>('Black Soil (Regur)');
  const [suitableCrops, setSuitableCrops] = useState('Cotton, Paddy, Red Gram, Vegetables');
  const [waterSource, setWaterSource] = useState('Borewell with 3HP Submersible Pump');
  const [ownerPhone, setOwnerPhone] = useState(userProfile?.phone || '');
  const [submittingLand, setSubmittingLand] = useState(false);

  // Edit Land Modal State
  const [editingLand, setEditingLand] = useState<LandListing | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Land Confirmation Modal State
  const [landToDelete, setLandToDelete] = useState<LandListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Insurance Modal State
  const [selectedPolicyForApply, setSelectedPolicyForApply] = useState<InsurancePolicy | null>(null);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [coverageSelected, setCoverageSelected] = useState('₹5,00,000 Landowner Security Cover');
  const [submittingInsurance, setSubmittingInsurance] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(userProfile?.name || '');
  const [profilePhone, setProfilePhone] = useState(userProfile?.phone || '');
  const [profileLocation, setProfileLocation] = useState(userProfile?.location || '');
  const [profileLandsCount, setProfileLandsCount] = useState(userProfile?.numberOfLands || 1);
  const [profileBio, setProfileBio] = useState(userProfile?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || '');
      setProfilePhone(userProfile.phone || '');
      setProfileLocation(userProfile.location || '');
      setProfileLandsCount(userProfile.numberOfLands || 1);
      setProfileBio(userProfile.bio || '');
    }
  }, [userProfile]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // 1. My Uploaded Lands
    const landsQuery = query(
      collection(db, 'lands'),
      where('ownerId', '==', currentUser.uid)
    );
    const unsubLands = onSnapshot(landsQuery, (snapshot) => {
      const lands: LandListing[] = [];
      snapshot.forEach((docSnap) => {
        lands.push({ id: docSnap.id, ...(docSnap.data() as Omit<LandListing, 'id'>) });
      });
      lands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyLands(lands);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'lands'));

    // 2. Farmers Working on My Lands
    const workQuery = query(
      collection(db, 'farming_works'),
      where('ownerId', '==', currentUser.uid)
    );
    const unsubWork = onSnapshot(workQuery, (snapshot) => {
      const works: FarmingWork[] = [];
      snapshot.forEach((docSnap) => {
        works.push({ id: docSnap.id, ...(docSnap.data() as Omit<FarmingWork, 'id'>) });
      });
      works.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWorkingFarmers(works);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'farming_works'));

    // 3. Insurance Policies Catalog
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

    // 4. My Insurance Applications
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
        setMyInsuranceApps(apps);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'insurance_applications')
    );

    return () => {
      unsubLands();
      unsubWork();
      unsubPolicies();
      unsubInsApps();
    };
  }, [currentUser]);

  // Handle Add Land
  const handleAddLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    if (!title.trim()) {
      showToast('Please enter a title for the farmland', 'error');
      return;
    }

    setSubmittingLand(true);
    try {
      const newLandData: Omit<LandListing, 'id'> = {
        title: title.trim(),
        description: description.trim() || 'Well-maintained fertile agricultural parcel with reliable water access.',
        photos: photos.length > 0 ? photos : [
          'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80'
        ],
        location: location.trim(),
        sizeAcres: Number(sizeAcres),
        rentAmount: Number(rentAmount),
        rentPeriod,
        soilType,
        suitableCrops: suitableCrops.trim(),
        isAvailable: true,
        waterSource: waterSource.trim(),
        ownerId: currentUser.uid,
        ownerName: userProfile.name || currentUser.displayName || 'Land Owner',
        ownerPhone: ownerPhone.trim() || userProfile.phone || '',
        ownerEmail: currentUser.email || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'lands'), newLandData);

      // Create notification
      await createNotification(
        currentUser.uid,
        'Farmland Published Successfully!',
        `Your land "${title.trim()}" is now live and visible to farmers on KETHWADI.`,
        'land',
        'my_lands'
      );

      // Update landowner profile count
      await updateUserProfile({
        numberOfLands: (userProfile.numberOfLands || 0) + 1,
      });

      showToast('Farmland successfully published! Visible to all farmers.');
      // Reset form
      setTitle('');
      setDescription('');
      setPhotos([]);
      setActiveTab('my_lands');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'lands');
      showToast('Could not publish farmland. Please try again.', 'error');
    } finally {
      setSubmittingLand(false);
    }
  };

  // Handle Toggle Availability
  const handleToggleAvailability = async (land: LandListing) => {
    try {
      const newAvailability = !land.isAvailable;
      await updateDoc(doc(db, 'lands', land.id), {
        isAvailable: newAvailability,
        status: newAvailability ? 'active' : 'under_cultivation',
        updatedAt: new Date().toISOString(),
      });
      showToast(newAvailability ? 'Land marked as Available' : 'Land marked as Unavailable');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lands/${land.id}`);
      showToast('Failed to update status', 'error');
    }
  };

  // Handle Delete Land (CRITICAL: Database deletion with confirmation popup)
  const handleConfirmDeleteLand = async () => {
    if (!landToDelete) return;
    setIsDeleting(true);
    try {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, 'lands', landToDelete.id));

      // 2. Notify landowner
      await createNotification(
        currentUser!.uid,
        'Farmland Deleted',
        `"${landToDelete.title}" was removed from the database and stopped being shown to farmers.`,
        'land'
      );

      showToast('Land successfully deleted from the platform.');
      setLandToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lands/${landToDelete.id}`);
      showToast('Error deleting land from database', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Save Edit
  const handleSaveEditLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLand) return;
    setSavingEdit(true);

    try {
      await updateDoc(doc(db, 'lands', editingLand.id), {
        title: editingLand.title,
        description: editingLand.description,
        location: editingLand.location,
        sizeAcres: Number(editingLand.sizeAcres),
        rentAmount: Number(editingLand.rentAmount),
        rentPeriod: editingLand.rentPeriod,
        soilType: editingLand.soilType,
        suitableCrops: editingLand.suitableCrops,
        waterSource: editingLand.waterSource,
        photos: editingLand.photos,
        updatedAt: new Date().toISOString(),
      });

      showToast('Farmland listing updated successfully!');
      setEditingLand(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lands/${editingLand.id}`);
      showToast('Failed to update land details', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Apply Insurance
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
        userRole: 'land_owner',
        userEmail: currentUser.email || '',
        userPhone: userProfile.phone || '',
        coverageSelected,
        nomineeName: nomineeName.trim(),
        nomineeRelation,
        status: 'submitted',
        notes: 'Land Owner direct portal application. Partner agency processing.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'insurance_applications'), newApp);

      await createNotification(
        currentUser.uid,
        'Insurance Application Received',
        `Your application for ${selectedPolicyForApply.policyName} has been submitted for underwriting.`,
        'insurance',
        'insurance'
      );

      showToast('Insurance application submitted successfully!');
      setSelectedPolicyForApply(null);
      setNomineeName('');
    } catch (err) {
      showToast('Failed to submit application.', 'error');
    } finally {
      setSubmittingInsurance(false);
    }
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        location: profileLocation.trim(),
        numberOfLands: Number(profileLandsCount),
        bio: profileBio.trim(),
      });
      showToast('Land Owner profile updated successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border border-emerald-700'
              : 'bg-red-900 text-white border border-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-2xl border-2 border-amber-400/50 shadow-md">
            {userProfile?.name?.charAt(0) || 'L'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-900/90 text-amber-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Land Owner Dashboard
              </span>
              <span className="text-xs text-emerald-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {userProfile?.location || 'India'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif mt-1">
              {userProfile?.name}
            </h1>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Managed Farmlands: {myLands.length} • Active Cultivators: {workingFarmers.length}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('add_land')}
          className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md w-full md:w-auto min-h-[44px]"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Upload New Farmland</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-emerald-100 text-xs sm:text-sm font-bold no-scrollbar">
        {[
          { id: 'my_lands', label: `My Uploaded Lands (${myLands.length})`, icon: Layers },
          { id: 'add_land', label: 'Add New Farmland', icon: PlusCircle },
          { id: 'working_farmers', label: `Farmers Working on My Land (${workingFarmers.length})`, icon: Briefcase },
          { id: 'insurance', label: `Life Insurance (${myInsuranceApps.length})`, icon: Shield },
          { id: 'profile', label: 'Owner Profile', icon: User },
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

      {/* TAB 1: MY UPLOADED LANDS */}
      {activeTab === 'my_lands' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 font-serif">
                My Farmland Listings
              </h2>
              <p className="text-xs text-gray-500">
                Manage your parcels, edit lease rents, toggle availability, or remove listings.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('add_land')}
              className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Farmland
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-emerald-800 font-semibold text-xs">
              Loading your farmlands...
            </div>
          ) : myLands.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-emerald-200 space-y-4">
              <Layers className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">You haven't uploaded any farmlands yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Publish your agricultural land to start receiving cultivator partnerships from verified farmers.
              </p>
              <button
                onClick={() => setActiveTab('add_land')}
                className="bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition"
              >
                + Upload Farmland Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myLands.map((land) => (
                <div
                  key={land.id}
                  className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={land.photos?.[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'}
                        alt={land.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-emerald-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {land.sizeAcres} Acres
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-lg shadow-xs ${
                            land.isAvailable
                              ? 'bg-emerald-500 text-emerald-950'
                              : 'bg-amber-500 text-amber-950'
                          }`}
                        >
                          {land.isAvailable ? 'Available' : 'Leased / Unavailable'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{land.location}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{land.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{land.description}</p>
                      </div>

                      <div className="bg-emerald-50/50 p-3 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rent:</span>
                          <span className="font-bold text-emerald-950">₹{land.rentAmount.toLocaleString()} / {land.rentPeriod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Soil:</span>
                          <span className="font-semibold text-gray-800">{land.soilType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Crops:</span>
                          <span className="font-medium text-gray-700 truncate max-w-[150px]">{land.suitableCrops}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleAvailability(land)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        land.isAvailable
                          ? 'border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100'
                          : 'border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {land.isAvailable ? 'Pause Listing' : 'Make Available'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingLand(land)}
                        className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 transition"
                        title="Edit Land"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectLand(land.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition"
                        title="View Public Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Critical Delete Button */}
                      <button
                        onClick={() => setLandToDelete(land)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                        title="Delete Land Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD NEW FARMLAND */}
      {activeTab === 'add_land' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 font-serif">
              Upload New Farmland Listing
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Provide thorough details. After publishing, this farmland will immediately appear in Farmer searches.
            </p>
          </div>

          <form onSubmit={handleAddLand} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Farmland Title / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fertile 8-Acre Black Cotton Farmland with Canal Irrigation"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Photo Uploader */}
            <ImageUpload
              images={photos}
              onChange={setPhotos}
              maxImages={4}
              label="Farmland Photos (Upload or pick fertile samples)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Location (Village/District) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Warangal, Telangana"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Land Size (Acres) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={sizeAcres}
                  onChange={(e) => setSizeAcres(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Lease Rent Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                  />
                  <select
                    value={rentPeriod}
                    onChange={(e) => setRentPeriod(e.target.value as any)}
                    className="text-xs rounded-xl border border-gray-300 px-2 bg-white"
                  >
                    <option value="year">/yr</option>
                    <option value="season">/season</option>
                    <option value="month">/mo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Soil Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value as any)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Black Soil (Regur)">Black Soil (Regur)</option>
                  <option value="Alluvial Soil">Alluvial Soil</option>
                  <option value="Red & Yellow Soil">Red & Yellow Soil</option>
                  <option value="Laterite Soil">Laterite Soil</option>
                  <option value="Clayey Loam">Clayey Loam</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Water & Irrigation Source
                </label>
                <input
                  type="text"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  placeholder="e.g. 2 Borewells with Electricity + Canal link"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Suitable Crops <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={suitableCrops}
                onChange={(e) => setSuitableCrops(e.target.value)}
                placeholder="e.g. Paddy, Cotton, Maize, Groundnut, Vegetables"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Detailed Description & Boundaries
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention road connectivity, fencing status, past harvest yields, or soil health testing..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Owner Contact Phone Number
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('my_lands')}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingLand}
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                {submittingLand && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Publish Farmland</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: FARMERS WORKING ON MY LAND */}
      {activeTab === 'working_farmers' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 font-serif">
              Cultivators & Farmers Working on My Farmlands
            </h2>
            <p className="text-xs text-gray-500">
              Real-time records of farmers who have joined and are actively cultivating your lands.
            </p>
          </div>

          {workingFarmers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Briefcase className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No active cultivators yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                When farmers browse your available farmlands and join, their cultivation details, crops, and start dates will be displayed here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workingFarmers.map((work) => (
                <div
                  key={work.id}
                  className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {work.landTitle} ({work.landSize} Acres)
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-1">
                        Cultivator: {work.farmerName}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase">
                      {work.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3.5 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Crop Being Planted:</span>
                      <span className="font-bold text-emerald-950 text-sm">{work.cropPlanted}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Agreed Lease Rent:</span>
                      <span className="font-bold text-emerald-950 text-sm">₹{work.landRent.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Cultivation Started:</span>
                      <span className="font-semibold text-gray-800">{work.startDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Location:</span>
                      <span className="font-semibold text-gray-800 truncate">{work.landLocation}</span>
                    </div>
                  </div>

                  {work.notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <strong>Cultivation Notes:</strong> {work.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{work.farmerPhone || 'Registered Farmer Phone'}</span>
                    </div>
                    <button
                      onClick={() => onSelectLand(work.landId)}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Inspect Farmland Listing →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIFE INSURANCE */}
      {activeTab === 'insurance' && (
        <div className="space-y-8">
          <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Farmland Owner Protection
              </div>
              <h2 className="text-2xl font-black font-serif">Life & Landowner Security Policies</h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl">
                Protection schemes designed for agricultural property holders and cultivators, underwritten by licensed government and commercial insurers.
              </p>
            </div>
          </div>

          {/* My Applications */}
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
                    </div>
                    <span className="text-xs font-black text-emerald-950">{app.coverageSelected}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies catalog */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition space-y-4"
              >
                <div className="space-y-3">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                    {policy.providerType}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 leading-snug">
                    {policy.policyName}
                  </h4>
                  <div className="p-3 bg-emerald-50/60 rounded-xl space-y-1">
                    <div className="text-[10px] text-gray-500">Coverage:</div>
                    <div className="text-base font-black text-emerald-950">{policy.coverage}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      Premium: {policy.premiumInfo}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600">{policy.eligibility}</p>
                </div>

                <button
                  onClick={() => setSelectedPolicyForApply(policy)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-xs"
                >
                  Apply for Policy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 font-serif">
                Land Owner Profile & Information
              </h3>
              <p className="text-xs text-gray-500">
                Verified information associated with your farmlands.
              </p>
            </div>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl transition"
              >
                Edit Profile
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

              <div>
                <label className="block font-bold text-gray-800 mb-1">Estimated Number of Lands Owned</label>
                <input
                  type="number"
                  min="1"
                  value={profileLandsCount}
                  onChange={(e) => setProfileLandsCount(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Bio / Background</label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="e.g. Agricultural landowner offering well-irrigated black soil land for lease."
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
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
                  <span className="text-gray-400 block text-[10px]">Contact Phone</span>
                  <span className="font-semibold text-gray-800">{userProfile?.phone || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Region</span>
                  <span className="font-semibold text-gray-800">{userProfile?.location || 'India'}</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                <span className="text-gray-400 block text-[10px]">Uploaded Farmland Parcels</span>
                <span className="font-black text-2xl text-emerald-950 block">{myLands.length} Active Listings</span>
              </div>

              {/* Session / Logout Box */}
              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Account Session</h4>
                  <p className="text-xs text-gray-500">Log out of your Land Owner account on this device.</p>
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

      {/* CONFIRMATION POPUP: DELETE FARMLAND (DATABASE DELETION) */}
      <ConfirmationModal
        isOpen={!!landToDelete}
        title="Delete Farmland Listing"
        message={`Are you sure you want to delete this land? "${landToDelete?.title || 'This land'}" will be permanently removed from the database and immediately stopped being shown to farmers.`}
        confirmLabel="Yes, Delete Farmland"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteLand}
        onCancel={() => setLandToDelete(null)}
      />

      {/* EDIT FARMLAND MODAL */}
      {editingLand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Farmland Details</h3>
              <button onClick={() => setEditingLand(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLand} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Farmland Title</label>
                <input
                  type="text"
                  required
                  value={editingLand.title}
                  onChange={(e) => setEditingLand({ ...editingLand, title: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={editingLand.location}
                    onChange={(e) => setEditingLand({ ...editingLand, location: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Size (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingLand.sizeAcres}
                    onChange={(e) => setEditingLand({ ...editingLand, sizeAcres: Number(e.target.value) })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Rent Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingLand.rentAmount}
                    onChange={(e) => setEditingLand({ ...editingLand, rentAmount: Number(e.target.value) })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Rent Period</label>
                  <select
                    value={editingLand.rentPeriod}
                    onChange={(e) => setEditingLand({ ...editingLand, rentPeriod: e.target.value as any })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="year">Per Year</option>
                    <option value="season">Per Season</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Suitable Crops</label>
                <input
                  type="text"
                  required
                  value={editingLand.suitableCrops}
                  onChange={(e) => setEditingLand({ ...editingLand, suitableCrops: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingLand.description}
                  onChange={(e) => setEditingLand({ ...editingLand, description: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLand(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 flex items-center gap-2"
                >
                  {savingEdit && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSURANCE MODAL */}
      {selectedPolicyForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100">
            <form onSubmit={handleApplyInsurance} className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Land Owner Life Policy
                </div>
                <h3 className="text-lg font-black text-gray-900 font-serif">
                  {selectedPolicyForApply.policyName}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Nominee Full Name *</label>
                <input
                  type="text"
                  required
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Relationship</label>
                  <select
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Coverage</label>
                  <input
                    type="text"
                    disabled
                    value={selectedPolicyForApply.coverage}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedPolicyForApply(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInsurance}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
