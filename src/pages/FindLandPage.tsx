import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import {
  Search,
  Filter,
  MapPin,
  Sprout,
  DollarSign,
  Maximize2,
  ChevronRight,
  Layers,
  CheckCircle,
  X,
  Droplets,
  RotateCcw
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { LandListing } from '../types';

interface FindLandPageProps {
  onSelectLand: (landId: string) => void;
  onAddLand?: () => void;
  userRole?: string;
}

export const FindLandPage: React.FC<FindLandPageProps> = ({ onSelectLand, onAddLand, userRole }) => {
  const [lands, setLands] = useState<LandListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSoil, setSelectedSoil] = useState<string>('All');
  const [maxRent, setMaxRent] = useState<number>(100000);
  const [minAcres, setMinAcres] = useState<number>(0);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  const soilTypes = [
    'All',
    'Black Soil (Regur)',
    'Alluvial Soil',
    'Red & Yellow Soil',
    'Laterite Soil',
    'Clayey Loam',
    'Sandy Loam',
  ];

  useEffect(() => {
    setLoading(true);
    // Real-time Firestore listener on lands collection
    const landsRef = collection(db, 'lands');
    const unsubscribe = onSnapshot(
      landsRef,
      (snapshot) => {
        const fetched: LandListing[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...(docSnap.data() as Omit<LandListing, 'id'>) });
        });
        // Sort newest first
        fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setLands(fetched);
        setLoading(false);
      },
      (err) => {
        setLands([]);
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, 'lands');
        } catch (diag) {
          console.warn('FindLandPage notice:', diag);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter application
  const filteredLands = lands.filter((land) => {
    // Availability
    if (onlyAvailable && !land.isAvailable) return false;

    // Soil type
    if (selectedSoil !== 'All' && land.soilType !== selectedSoil) return false;

    // Max rent
    if (land.rentAmount > maxRent) return false;

    // Min acres
    if (land.sizeAcres < minAcres) return false;

    // Search query match (title, location, suitable crops, ownerName)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = land.title.toLowerCase().includes(q);
      const matchLoc = land.location.toLowerCase().includes(q);
      const matchCrops = land.suitableCrops.toLowerCase().includes(q);
      const matchSoil = land.soilType.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchCrops && !matchSoil) return false;
    }

    // Specific crop filter
    if (selectedCrop.trim()) {
      if (!land.suitableCrops.toLowerCase().includes(selectedCrop.toLowerCase())) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSoil('All');
    setMaxRent(100000);
    setMinAcres(0);
    setOnlyAvailable(true);
    setSelectedCrop('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <Sprout className="w-4 h-4" /> Live Arable Lands
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif">
            Find Available Farmland
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200">
            Browse verified agricultural lands available for cultivation across soil varieties & lease terms.
          </p>
        </div>

        {userRole === 'land_owner' && onAddLand && (
          <button
            onClick={onAddLand}
            className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition shrink-0"
          >
            + Add My Farmland
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by village, district, crop (e.g. Cotton, Paddy), or land title..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-emerald-50/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Soil Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Soil Type
            </label>
            <select
              value={selectedSoil}
              onChange={(e) => setSelectedSoil(e.target.value)}
              className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-600 bg-white"
            >
              {soilTypes.map((soil) => (
                <option key={soil} value={soil}>
                  {soil}
                </option>
              ))}
            </select>
          </div>

          {/* Min Acres */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Min Size: <span className="text-emerald-700">{minAcres} Acres</span>
            </label>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={minAcres}
              onChange={(e) => setMinAcres(Number(e.target.value))}
              className="w-full accent-emerald-700"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0 Ac</span>
              <span>10 Ac</span>
              <span>25+ Ac</span>
            </div>
          </div>

          {/* Max Rent */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Max Rent: <span className="text-emerald-700">₹{maxRent.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="2000"
              max="150000"
              step="2000"
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="w-full accent-emerald-700"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>₹2K</span>
              <span>₹75K</span>
              <span>₹150K</span>
            </div>
          </div>

          {/* Availability & Reset */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 accent-emerald-700"
              />
              <span>Available Only</span>
            </label>

            <button
              onClick={resetFilters}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-bold text-emerald-950">
          Showing <span className="text-emerald-700">{filteredLands.length}</span> Farmlands
        </p>
      </div>

      {/* Farmland Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100 p-4 space-y-4">
              <div className="aspect-video bg-gray-200 rounded-2xl" />
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-4 bg-gray-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : lands.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Farmlands Listed Yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            There are currently no farmlands listed in the database. Landowners can register and post their fertile agricultural plots for verified farmers to cultivate.
          </p>
          {onAddLand && (
            <button
              onClick={onAddLand}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>List Your Farmland</span>
            </button>
          )}
        </div>
      ) : filteredLands.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Farmlands Match Your Search</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Try adjusting your search location, lowering the minimum acre requirement, or resetting filters to see all arable listings.
          </p>
          <button
            onClick={resetFilters}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLands.map((land) => (
            <div
              key={land.id}
              onClick={() => onSelectLand(land.id)}
              className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition duration-200 cursor-pointer flex flex-col group"
            >
              {/* Photo & Badges */}
              <div className="relative aspect-video bg-emerald-950/10 overflow-hidden">
                <img
                  src={
                    land.photos && land.photos.length > 0
                      ? land.photos[0]
                      : 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={land.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-emerald-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {land.sizeAcres} Acres
                  </span>
                  {land.isAvailable ? (
                    <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-2 py-1 rounded-lg shadow-xs">
                      Available
                    </span>
                  ) : (
                    <span className="bg-gray-800/90 text-gray-200 text-[10px] font-bold px-2 py-1 rounded-lg">
                      Under Cultivation
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-emerald-950 text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                  ₹{land.rentAmount.toLocaleString()} <span className="font-normal text-[10px] text-gray-600">/ {land.rentPeriod}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{land.location}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-800 transition">
                    {land.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {land.description || 'Prime agricultural farmland ready for seasonal cultivation.'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Soil:</span>
                    <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded">
                      {land.soilType}
                    </span>
                  </div>

                  {land.waterSource && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Water Source:</span>
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-600" />
                        {land.waterSource}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Suitable:</span>
                    <span className="font-medium text-gray-700 truncate max-w-[170px]" title={land.suitableCrops}>
                      {land.suitableCrops}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <div className="text-[11px] text-gray-500">
                      Owner: <span className="font-semibold text-gray-800">{land.ownerName}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center gap-1 group-hover:translate-x-1 transition">
                      View Details & Join <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
