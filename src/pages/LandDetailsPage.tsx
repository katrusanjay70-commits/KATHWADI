import React, { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc
} from 'firebase/firestore';
import {
  MapPin,
  Sprout,
  DollarSign,
  Maximize2,
  Droplets,
  Layers,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { LandListing, FarmingWork } from '../types';
import { createNotification } from '../services/dbInit';

interface LandDetailsPageProps {
  landId: string;
  onBack: () => void;
  onNavigateToWork: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onEditLand?: (landId: string) => void;
}

export const LandDetailsPage: React.FC<LandDetailsPageProps> = ({
  landId,
  onBack,
  onNavigateToWork,
  onOpenAuth,
  onEditLand,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [land, setLand] = useState<LandListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Join land modal state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [cropPlanted, setCropPlanted] = useState('');
  const [farmerPhoneInput, setFarmerPhoneInput] = useState(userProfile?.phone || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [farmerNotes, setFarmerNotes] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (userProfile?.phone) {
      setFarmerPhoneInput(userProfile.phone);
    }
  }, [userProfile]);

  useEffect(() => {
    async function fetchLand() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'lands', landId));
        if (snap.exists()) {
          setLand({ id: snap.id, ...(snap.data() as Omit<LandListing, 'id'>) });
        } else {
          setLand(null);
        }
      } catch (err) {
        setLand(null);
        try {
          handleFirestoreError(err, OperationType.GET, `lands/${landId}`);
        } catch (diag) {
          console.warn('Land details fetch notice:', diag);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLand();
  }, [landId]);

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !land) return;
    if (!cropPlanted.trim()) {
      setErrorMessage('Please state the intended crop you plan to cultivate.');
      return;
    }

    setSubmittingJoin(true);
    setErrorMessage('');

    const effectivePhone = farmerPhoneInput.trim() || userProfile.phone || '';

    try {
      // 1. Create FarmingWork record (always authoritatively records cultivation partnership / request)
      const workData: Omit<FarmingWork, 'id'> = {
        landId: land.id,
        landTitle: land.title,
        landLocation: land.location,
        landSize: land.sizeAcres,
        landRent: land.rentAmount,
        farmerId: currentUser.uid,
        farmerName: userProfile.name || currentUser.displayName || 'Farmer Cultivator',
        farmerEmail: currentUser.email || '',
        farmerPhone: effectivePhone,
        ownerId: land.ownerId,
        ownerName: land.ownerName,
        ownerPhone: land.ownerPhone || '',
        status: 'active',
        cropPlanted: cropPlanted.trim(),
        startDate: startDate || new Date().toISOString().split('T')[0],
        notes: farmerNotes.trim() || 'Cultivation partnership request initiated via KETHWADI.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'farming_works'), workData);

      // 2. Update land status safely (non-blocking so any land doc rule boundary doesn't prevent partnership)
      try {
        await updateDoc(doc(db, 'lands', land.id), {
          status: 'under_cultivation',
          activeFarmerId: currentUser.uid,
          activeFarmerName: userProfile.name || 'Partner Farmer',
          updatedAt: new Date().toISOString(),
        });
      } catch (landSyncErr) {
        console.warn('Notice: Land listing status update handled safely:', landSyncErr);
      }

      // 3. Notify Land Owner
      try {
        await createNotification(
          land.ownerId,
          'New Cultivation Request Received!',
          `Farmer ${userProfile.name} (${effectivePhone ? 'Phone: ' + effectivePhone : 'Registered'}) has submitted a cultivation request for "${land.title}" to grow ${cropPlanted.trim()}. Check Working Farmers & Requests.`,
          'work',
          'landowner_farmers'
        );
      } catch (notifErr) {
        console.warn('Owner notification logged:', notifErr);
      }

      // 4. Notify Farmer
      try {
        await createNotification(
          currentUser.uid,
          'Cultivation Request Transmitted',
          `Your cultivation request for "${land.title}" has been transmitted to landowner ${land.ownerName}. Track progress in My Farming Work.`,
          'work',
          'farming_work'
        );
      } catch (notifErr) {
        console.warn('Farmer notification logged:', notifErr);
      }

      setJoinSuccess(true);
    } catch (err: any) {
      console.error('Failed to send request to landowner:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'farming_works');
      } catch (diag) {
        console.warn('Diagnostic handled:', diag);
      }
      setErrorMessage('Could not send request to landowner. Please verify your connection and try again.');
    } finally {
      setSubmittingJoin(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-emerald-900 font-semibold">Loading farmland details...</p>
      </div>
    );
  }

  if (!land) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Farmland Not Found</h2>
        <p className="text-xs text-gray-500">
          This farmland listing may have been leased out or removed by the landowner.
        </p>
        <button
          onClick={onBack}
          className="bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition"
        >
          Back to Available Farmlands
        </button>
      </div>
    );
  }

  const isOwner = currentUser?.uid === land.ownerId;
  const isFarmer = userProfile?.role === 'farmer';
  const photos = land.photos && land.photos.length > 0 ? land.photos : [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3.5 py-2 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Farmlands</span>
        </button>

        {isOwner && onEditLand && (
          <button
            onClick={() => onEditLand(land.id)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs transition"
          >
            Edit My Land Listing
          </button>
        )}
      </div>

      {/* Main Grid: Gallery & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photos & Description (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo Gallery */}
          <div className="bg-white rounded-3xl p-3 border border-emerald-100 shadow-sm space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-emerald-950/10">
              <img
                src={photos[selectedPhotoIndex] || photos[0]}
                alt={land.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-emerald-950/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                {land.sizeAcres} Acres Arable Land
              </div>
              <div className="absolute top-4 right-4">
                {land.isAvailable ? (
                  <span className="bg-emerald-500 text-emerald-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                    Ready for Cultivation
                  </span>
                ) : (
                  <span className="bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                    Under Active Cultivation
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail selector if multiple images */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      selectedPhotoIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Land Name & Location */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{land.location}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 font-serif">
                {land.title}
              </h1>
            </div>

            {/* Key Farmland Specs Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" /> Farmland Size
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-950 mt-1">
                  {land.sizeAcres} Acres
                </div>
              </div>

              <div className="p-3 sm:p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Soil Type
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-950 mt-1 truncate" title={land.soilType}>
                  {land.soilType}
                </div>
              </div>

              <div className="p-3 sm:p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> Water Source
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-950 mt-1 truncate">
                  {land.waterSource || 'Borewell / Canal'}
                </div>
              </div>

              <div className="p-3 sm:p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100">
                <div className="text-[10px] sm:text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Lease Rent
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-950 mt-1">
                  ₹{land.rentAmount.toLocaleString()} <span className="text-[10px] font-normal">/{land.rentPeriod}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Farmland & Irrigation Overview
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                {land.description || 'This fertile parcel offers high nutrient composition, gentle elevation drainage, and access to all-season water sources. Ideal for commercial pulses, grains, or organic horticulture.'}
              </p>
            </div>

            {/* Suitable Crops */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Recommended & Suitable Crops
              </h3>
              <div className="flex flex-wrap gap-2">
                {land.suitableCrops.split(',').map((crop, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-emerald-100/70 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200"
                  >
                    <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                    {crop.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Rent summary & Landowner Info & Join action */}
        <div className="space-y-6">
          {/* Rent & Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <div className="text-xs text-gray-500 font-semibold">Agreed Lease / Rent</div>
              <div className="text-3xl font-black text-emerald-950 font-serif mt-1">
                ₹{land.rentAmount.toLocaleString()}
                <span className="text-xs font-semibold text-gray-500 ml-1">/ {land.rentPeriod}</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                No middleman commissions • Direct cultivator partnership
              </p>
            </div>

            {/* Land Owner Profile Box */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <User className="w-4 h-4 text-emerald-700" /> Farmland Owner
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {land.ownerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    {land.ownerName}
                    <span title="Verified Landowner">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500">Verified Farmland Owner</p>
                </div>
              </div>

              {/* Secure contact details */}
              <div className="text-xs text-gray-600 space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{land.location}</span>
                </div>
                {land.ownerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{land.ownerPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {isOwner ? (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center space-y-2">
                <p className="text-xs font-bold text-amber-900">You are the Owner of this Farmland</p>
                <button
                  onClick={() => onEditLand?.(land.id)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Edit Land Details
                </button>
              </div>
            ) : !currentUser ? (
              <div className="space-y-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md shadow-emerald-700/20"
                >
                  Sign In to Join this Farmland
                </button>
                <p className="text-[11px] text-center text-gray-500">
                  Farmers can browse and join farmlands freely after quick authentication.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  disabled={!land.isAvailable}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
                >
                  <Sprout className="w-5 h-5 text-emerald-200" />
                  <span>{land.isAvailable ? 'Send Cultivation Request to Landowner' : 'Currently Under Cultivation'}</span>
                </button>
                <p className="text-[11px] text-center text-gray-500 leading-tight">
                  Send a cultivation request directly to landowner <strong>{land.ownerName}</strong>. Track your progress in <strong>My Farming Work</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Support Guarantee notice */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 text-xs text-gray-600 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>KETHWADI Cultivator Assurance</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Every farmland listing on KETHWADI is screened for boundary clarity and cultivation readiness. Farmers cultivate directly with landowner mutual agreement.
            </p>
          </div>
        </div>
      </div>

      {/* Join Land Confirmation Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 my-auto">
            {joinSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-emerald-950 font-serif">
                  Cultivation Request Sent!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Your request to cultivate <strong>{cropPlanted}</strong> on <strong>"{land.title}"</strong> has been transmitted to landowner <strong>{land.ownerName}</strong>.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      onNavigateToWork();
                    }}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition"
                  >
                    Go to My Farming Work
                  </button>
                  <button
                    onClick={() => setIsJoinModalOpen(false)}
                    className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs sm:text-sm hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmJoin} className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Cultivation Partnership Proposal
                  </div>
                  <h3 className="text-xl font-black text-gray-900 font-serif">
                    Request Cultivation on "{land.title}"
                  </h3>
                  <p className="text-xs text-gray-500">
                    {land.sizeAcres} Acres in {land.location} • ₹{land.rentAmount.toLocaleString()}/{land.rentPeriod} • Owner: {land.ownerName}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Planned Crop for Cultivation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cropPlanted}
                    onChange={(e) => setCropPlanted(e.target.value)}
                    placeholder="e.g. Paddy (Rice), Cotton, Soybean, Organic Vegetables"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Suitable recommendations for this soil: {land.suitableCrops}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Your Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={farmerPhoneInput}
                      onChange={(e) => setFarmerPhoneInput(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Landowner {land.ownerName} will reach out directly on this phone number.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Target Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Farmer Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={userProfile?.name || 'Registered Cultivator'}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Proposal Terms / Message to Owner (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={farmerNotes}
                    onChange={(e) => setFarmerNotes(e.target.value)}
                    placeholder="Mention season duration, water usage schedule, harvest sharing, or payment terms..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    disabled={submittingJoin}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingJoin}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2"
                  >
                    {submittingJoin && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>Send Request to Land Owner</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
