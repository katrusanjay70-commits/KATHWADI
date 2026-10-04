export type UserRole = 'farmer' | 'land_owner' | 'admin';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  photoUrl?: string;
  // Farmer specific
  farmingExperience?: string;
  skills?: string;
  preferredCrops?: string;
  farmingStatus?: string; // e.g. "Available for cultivation", "Currently engaged"
  workerStatus?: 'Available' | 'Working' | 'Completed' | 'Inactive';
  isDisabled?: boolean;
  // Land Owner specific
  numberOfLands?: number;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LandListing {
  id: string;
  title: string;
  description: string;
  photos: string[];
  location: string;
  sizeAcres: number;
  rentAmount: number;
  rentPeriod: 'month' | 'year' | 'season';
  soilType: 'Alluvial Soil' | 'Black Soil (Regur)' | 'Red & Yellow Soil' | 'Laterite Soil' | 'Clayey Loam' | 'Sandy Loam' | 'Other';
  suitableCrops: string;
  isAvailable: boolean;
  waterSource?: string; // Borewell, Canal, River, Rainfed, Drip Irrigation
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  status: 'active' | 'under_cultivation' | 'unavailable';
  createdAt: string;
  updatedAt?: string;
}

export interface FarmingWork {
  id: string;
  landId: string;
  landTitle: string;
  landLocation: string;
  landSize: number;
  landRent: number;
  farmerId: string;
  farmerName: string;
  farmerEmail?: string;
  farmerPhone?: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  status: 'active' | 'completed' | 'cancelled' | 'inactive';
  cropPlanted: string;
  startDate: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InsurancePolicy {
  id: string;
  policyName: string;
  provider: string; // e.g. "LIC of India / PMJJBY", "Agriculture Insurance Company of India (AIC)"
  coverage: string; // e.g. "₹2,00,000 to ₹10,00,000"
  premiumInfo: string; // e.g. "₹436 / year"
  eligibility: string; // e.g. "Age 18-50 years, active agriculturist or farmland owner"
  keyBenefits: string[];
  providerType: 'Government Scheme' | 'Licensed Insurer' | 'Agricultural Co-op';
  applicationUrl?: string;
  statusBadge?: string;
}

export interface InsuranceApplication {
  id: string;
  policyId: string;
  policyName: string;
  provider: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail: string;
  userPhone: string;
  coverageSelected: string;
  nomineeName: string;
  nomineeRelation: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoanApplication {
  id: string;
  loanSchemeName: string;
  provider: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amountRequested: number;
  purpose: string;
  tenureMonths: number;
  landReference?: string;
  status: 'submitted' | 'under_review' | 'recommended' | 'rejected';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SeedSupportRequest {
  id: string;
  cropType: string;
  quantityBags: number;
  season: 'Kharif (Monsoon)' | 'Rabi (Winter)' | 'Zaid (Summer)';
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  deliveryAddress: string;
  status: 'submitted' | 'approved' | 'dispatched' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'land' | 'work' | 'insurance' | 'loan' | 'seed' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  targetType: 'land' | 'user' | 'work';
  targetId: string;
  targetTitle: string;
  reportedBy: string;
  reportedByName?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}
