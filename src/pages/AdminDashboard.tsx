import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Briefcase,
  Shield,
  Coins,
  Wheat,
  FileText,
  Bell,
  Settings,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  UserCheck,
  UserX,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  Clock,
  User,
  Plus,
  ArrowUpRight,
  Sparkles,
  Droplets,
  Sprout,
  X,
  Menu,
  Send
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  UserProfile,
  LandListing,
  FarmingWork,
  InsuranceApplication,
  LoanApplication,
  SeedSupportRequest,
  ReportItem,
  NotificationItem
} from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { createNotification } from '../services/dbInit';
import { purgeFakeDataFromDatabase } from '../services/seedFarmlands';

interface AdminDashboardProps {
  onSelectLand: (landId: string) => void;
  onNavigateHome: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'farmers'
  | 'landowners'
  | 'lands'
  | 'workers'
  | 'insurance'
  | 'loans'
  | 'seeds'
  | 'reports'
  | 'notifications'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectLand,
  onNavigateHome,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real Database Collections State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [lands, setLands] = useState<LandListing[]>([]);
  const [farmingWorks, setFarmingWorks] = useState<FarmingWork[]>([]);
  const [insuranceApps, setInsuranceApps] = useState<InsuranceApplication[]>([]);
  const [loanApps, setLoanApps] = useState<LoanApplication[]>([]);
  const [seedRequests, setSeedRequests] = useState<SeedSupportRequest[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState<string>('All');
  const [landFilter, setLandFilter] = useState<string>('All');

  // Modals & Inspection States
  const [selectedFarmerForDetails, setSelectedFarmerForDetails] = useState<UserProfile | null>(null);
  const [selectedLandForWorkers, setSelectedLandForWorkers] = useState<LandListing | null>(null);
  const [landToDelete, setLandToDelete] = useState<LandListing | null>(null);
  const [workToRemove, setWorkToRemove] = useState<FarmingWork | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserProfile | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // New Notification Broadcast Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<'all' | 'farmer' | 'land_owner'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isPurgingData, setIsPurgingData] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // If session ends or user logs out, immediately return to public website
  useEffect(() => {
    if (!currentUser) {
      onNavigateHome();
    }
  }, [currentUser, onNavigateHome]);

  const handleAdminLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn('Admin logout notice:', err);
    } finally {
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
      onNavigateHome();
    }
  };

  // Feedback Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email === 'katrusanjay70@gmail.com';

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isAdmin) return;

    // 1. Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setUsers(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // 2. Lands
    const unsubLands = onSnapshot(collection(db, 'lands'), (snap) => {
      const list: LandListing[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<LandListing, 'id'>) }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setLands(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'lands'));

    // 3. Farming Works (Staff / Worker arrangements)
    const unsubWorks = onSnapshot(collection(db, 'farming_works'), (snap) => {
      const list: FarmingWork[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<FarmingWork, 'id'>) }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setFarmingWorks(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'farming_works'));

    // 4. Insurance
    const unsubIns = onSnapshot(
      collection(db, 'insurance_applications'),
      (snap) => {
        const list: InsuranceApplication[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<InsuranceApplication, 'id'>) }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setInsuranceApps(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'insurance_applications')
    );

    // 5. Loans
    const unsubLoans = onSnapshot(
      collection(db, 'loan_applications'),
      (snap) => {
        const list: LoanApplication[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<LoanApplication, 'id'>) }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setLoanApps(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'loan_applications')
    );

    // 6. Seeds
    const unsubSeeds = onSnapshot(
      collection(db, 'seed_support_requests'),
      (snap) => {
        const list: SeedSupportRequest[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<SeedSupportRequest, 'id'>) }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSeedRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'seed_support_requests')
    );

    // 7. Reports
    const unsubReports = onSnapshot(
      collection(db, 'reports'),
      (snap) => {
        const list: ReportItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ReportItem, 'id'>) }));
        setReports(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );

    // 8. Notifications
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const list: NotificationItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      unsubUsers();
      unsubLands();
      unsubWorks();
      unsubIns();
      unsubLoans();
      unsubSeeds();
      unsubReports();
      unsubNotifs();
    };
  }, [isAdmin]);

  // Protected Page Barrier
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 font-serif">Admin Authentication Required</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            The KETHWADI Admin Portal is protected. Normal Farmers and Land Owners cannot access staff administration pages.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onNavigateHome}
              className="w-full bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs hover:bg-emerald-900 transition"
            >
              Return to Public Platform
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculated Metrics from Real Database
  const totalFarmers = users.filter((u) => u.role === 'farmer').length;
  const totalLandOwners = users.filter((u) => u.role === 'land_owner').length;
  const totalAvailableLands = lands.filter((l) => l.isAvailable).length;
  const totalActiveFarmingWork = farmingWorks.filter((w) => w.status === 'active').length;
  
  // Total Workers Currently Working: count of distinct farmers who have an active farming work
  const activeWorkerIds = new Set(
    farmingWorks.filter((w) => w.status === 'active').map((w) => w.farmerId)
  );
  const totalWorkersCurrentlyWorking = activeWorkerIds.size;

  // Recently Added Farmers (last 5)
  const recentlyAddedFarmers = users
    .filter((u) => u.role === 'farmer')
    .slice(0, 5);

  // Recently Added Lands (last 5)
  const recentlyAddedLands = lands.slice(0, 5);

  // Recent Platform Activity Log (Constructed live from database events)
  const recentActivities = [
    ...farmingWorks.slice(0, 5).map((w) => ({
      id: `w-${w.id}`,
      type: 'work',
      title: `${w.farmerName} joined ${w.landTitle}`,
      time: w.createdAt,
      desc: `Cultivating ${w.cropPlanted} • Owner: ${w.ownerName}`,
      badge: w.status,
      badgeColor: w.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
    })),
    ...lands.slice(0, 4).map((l) => ({
      id: `l-${l.id}`,
      type: 'land',
      title: `Farmland published: "${l.title}"`,
      time: l.createdAt,
      desc: `${l.sizeAcres} Acres in ${l.location} by ${l.ownerName}`,
      badge: l.isAvailable ? 'Available' : 'Leased',
      badgeColor: l.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
    })),
    ...insuranceApps.slice(0, 3).map((i) => ({
      id: `i-${i.id}`,
      type: 'insurance',
      title: `Insurance inquiry: ${i.policyName}`,
      time: i.createdAt,
      desc: `Applied by ${i.userName} (${i.userRole})`,
      badge: i.status,
      badgeColor: 'bg-blue-100 text-blue-800'
    })),
  ].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()).slice(0, 8);

  // Filtered Workers list
  const allFarmersList = users.filter((u) => u.role === 'farmer');
  const enrichedWorkers = allFarmersList.map((farmer) => {
    const activeWork = farmingWorks.find(
      (w) => w.farmerId === farmer.userId && w.status === 'active'
    );
    const pastWorks = farmingWorks.filter(
      (w) => w.farmerId === farmer.userId && w.status !== 'active'
    );

    let status: 'Working' | 'Available' | 'Completed' | 'Inactive' = 'Available';
    if (farmer.isDisabled) {
      status = 'Inactive';
    } else if (activeWork) {
      status = 'Working';
    } else if (pastWorks.length > 0) {
      status = 'Completed';
    } else {
      status = 'Available';
    }

    return {
      farmer,
      activeWork,
      pastWorks,
      status,
    };
  });

  const filteredWorkers = enrichedWorkers.filter((item) => {
    if (workerStatusFilter !== 'All' && item.status !== workerStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.farmer.name.toLowerCase().includes(q);
      const matchLoc = item.farmer.location?.toLowerCase().includes(q) || false;
      const matchSkills = item.farmer.skills?.toLowerCase().includes(q) || false;
      const matchLand = item.activeWork?.landTitle.toLowerCase().includes(q) || false;
      if (!matchName && !matchLoc && !matchSkills && !matchLand) return false;
    }
    return true;
  });

  // Admin Action: Update Work Status (e.g. from active to completed, inactive)
  const handleUpdateWorkStatus = async (
    workId: string,
    newStatus: 'active' | 'completed' | 'inactive' | 'cancelled'
  ) => {
    try {
      await updateDoc(doc(db, 'farming_works', workId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      const workItem = farmingWorks.find((w) => w.id === workId);
      if (workItem) {
        await createNotification(
          workItem.farmerId,
          'Work Status Updated by Administrator',
          `Your cultivation assignment on "${workItem.landTitle}" is now marked as ${newStatus}.`,
          'work',
          'farming_work'
        );
        await createNotification(
          workItem.ownerId,
          'Worker Status Updated by Administrator',
          `Cultivator ${workItem.farmerName}'s assignment on "${workItem.landTitle}" was updated to ${newStatus}.`,
          'work',
          'landowner_farmers'
        );
      }

      showToast(`Worker arrangement status updated to ${newStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `farming_works/${workId}`);
      showToast('Error updating work status', 'error');
    }
  };

  // Admin Action: Remove worker from active arrangement
  const handleConfirmRemoveWorker = async () => {
    if (!workToRemove) return;
    setIsProcessingAction(true);
    try {
      // Update status to 'completed' / 'inactive' to maintain historical audit record
      await updateDoc(doc(db, 'farming_works', workToRemove.id), {
        status: 'completed',
        notes: `Cultivation completed / concluded by Administrator on ${new Date().toLocaleDateString()}.`,
        updatedAt: new Date().toISOString(),
      });

      // Update land availability back to available if no other active farmers
      await updateDoc(doc(db, 'lands', workToRemove.landId), {
        isAvailable: true,
        status: 'active',
        updatedAt: new Date().toISOString(),
      });

      await createNotification(
        workToRemove.farmerId,
        'Cultivation Assignment Concluded',
        `Administrator concluded your active work arrangement on "${workToRemove.landTitle}". Historical records are saved under My Farming Work.`,
        'work',
        'farming_work'
      );

      await createNotification(
        workToRemove.ownerId,
        'Farmland Worker Concluded',
        `Worker ${workToRemove.farmerName} has been unassigned from "${workToRemove.landTitle}". Farmland is now marked available for new cultivators.`,
        'work',
        'landowner_farmers'
      );

      showToast(`Worker ${workToRemove.farmerName} removed from active arrangement.`);
      setWorkToRemove(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `farming_works/${workToRemove.id}`);
      showToast('Failed to conclude work arrangement', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Admin Action: Toggle Disable Account
  const handleToggleUserDisabled = async () => {
    if (!userToToggleStatus) return;
    setIsProcessingAction(true);
    try {
      const willDisable = !userToToggleStatus.isDisabled;
      await updateDoc(doc(db, 'users', userToToggleStatus.userId), {
        isDisabled: willDisable,
        updatedAt: new Date().toISOString(),
      });

      showToast(
        willDisable
          ? `Account for ${userToToggleStatus.name} has been disabled.`
          : `Account for ${userToToggleStatus.name} has been restored.`
      );
      setUserToToggleStatus(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userToToggleStatus.userId}`);
      showToast('Error updating account status', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Admin Action: Delete Farmland Listing
  const handleConfirmDeleteLand = async () => {
    if (!landToDelete) return;
    setIsProcessingAction(true);
    try {
      await deleteDoc(doc(db, 'lands', landToDelete.id));

      await createNotification(
        landToDelete.ownerId,
        'Farmland Listing Removed by Admin',
        `Your listing "${landToDelete.title}" was removed by moderation.`,
        'land'
      );

      showToast('Farmland listing deleted from database.');
      setLandToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lands/${landToDelete.id}`);
      showToast('Error removing land listing', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Admin Action: Purge Fake / Demo data from database
  const handlePurgeFakeData = async () => {
    if (!window.confirm('Scan database and permanently delete all fake / demo farmland listings and test records?')) {
      return;
    }
    setIsPurgingData(true);
    try {
      const res = await purgeFakeDataFromDatabase();
      showToast(`Fake data purge complete: removed ${res.deletedLands} fake farmlands & ${res.deletedUsers} demo records.`);
    } catch (err) {
      showToast('Error purging fake data from database', 'error');
    } finally {
      setIsPurgingData(false);
    }
  };

  // Broadcast System Notification
  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      const recipients = users.filter((u) => {
        if (broadcastTargetRole === 'all') return true;
        return u.role === broadcastTargetRole;
      });

      for (const recipient of recipients) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipient.userId,
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: 'system',
          read: false,
          link: recipient.role === 'farmer' ? 'farmer_dashboard' : 'landowner_dashboard',
          createdAt: new Date().toISOString(),
        });
      }

      showToast(`Broadcast notification dispatched to ${recipients.length} users.`);
      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      showToast('Error sending broadcast notification', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Navigation Sidebar Items
  const sidebarItems: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'farmers', label: 'Farmers', icon: Users, count: totalFarmers },
    { id: 'landowners', label: 'Land Owners', icon: UserCheck, count: totalLandOwners },
    { id: 'lands', label: 'Farmlands', icon: Layers, count: lands.length },
    { id: 'workers', label: 'Workers (Staff)', icon: Briefcase, count: enrichedWorkers.length },
    { id: 'insurance', label: 'Insurance', icon: Shield, count: insuranceApps.length },
    { id: 'loans', label: 'Agri Loans', icon: Coins, count: loanApps.length },
    { id: 'seeds', label: 'Seed Support', icon: Wheat, count: seedRequests.length },
    { id: 'reports', label: 'Reports', icon: FileText, count: reports.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f3f7f4] flex flex-col md:flex-row">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom duration-150 ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-white border border-emerald-700'
              : 'bg-red-950 text-white border border-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-300" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* MOBILE TOP BAR (md:hidden) */}
      <div className="md:hidden bg-emerald-950 text-white px-4 py-3 border-b border-emerald-900 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shadow-xs">
            <Sprout className="w-4 h-4 text-emerald-950" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight font-serif text-white block leading-none">
              KETHWADI
            </span>
            <span className="text-[9px] text-amber-300 uppercase tracking-widest font-bold">
              Admin Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
            {activeTab}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-emerald-900/80 text-white hover:bg-emerald-800 transition"
            aria-label="Toggle Admin Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-300" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-emerald-950 text-white flex flex-col justify-between p-4 shadow-2xl h-full overflow-y-auto animate-in slide-in-from-left duration-200 z-10">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold">
                    <Sprout className="w-4 h-4 text-emerald-950" />
                  </div>
                  <div>
                    <span className="font-serif font-black text-sm text-white block">KETHWADI</span>
                    <span className="text-[9px] text-amber-300 uppercase font-bold">Admin Portal</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-3 p-2.5 bg-emerald-900/70 rounded-xl border border-emerald-800 text-[11px] text-emerald-200">
                <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Super Admin</div>
                <div className="truncate font-semibold text-white">{currentUser?.email}</div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-amber-500 text-emerald-950 font-bold shadow-xs'
                          : 'text-emerald-100 hover:bg-emerald-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-950' : 'text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-900 text-emerald-300'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer inside drawer */}
            <div className="pt-4 border-t border-emerald-900 space-y-2 mt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateHome();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-900 hover:text-white transition"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Public Website View</span>
              </button>
              <button
                onClick={handleAdminLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-red-950/60 text-red-200 border border-red-800 hover:bg-red-900 hover:text-white transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout Administrator'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP ADMIN SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-emerald-950 text-white flex-shrink-0 flex-col justify-between border-r border-emerald-900 shadow-md min-h-screen sticky top-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-emerald-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shadow-xs">
                <Sprout className="w-5 h-5 text-emerald-950" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight font-serif text-white block">
                  KETHWADI
                </span>
                <span className="text-[10px] text-amber-300 uppercase tracking-widest font-bold">
                  Admin Console
                </span>
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-emerald-900/70 rounded-xl border border-emerald-800 text-[11px] text-emerald-200">
              <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Super Admin</div>
              <div className="truncate font-semibold text-white">{currentUser?.email}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-amber-500 text-emerald-950 font-bold shadow-xs'
                      : 'text-emerald-100/90 hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-950' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-900 text-emerald-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-emerald-900/80 space-y-2">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-900 hover:text-white transition"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Public Website View</span>
          </button>
          <button
            onClick={handleAdminLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-950/60 hover:text-red-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout Administrator'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Staff & Land Management
              </span>
              <span className="text-xs text-emerald-700 font-medium">Live Database Synchronized</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-serif capitalize mt-0.5">
              {activeTab === 'dashboard' ? 'Admin Platform Overview' : activeTab.replace('_', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePurgeFakeData}
              disabled={isPurgingData}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
              title="Permanently remove all fake / demo data from database"
            >
              {isPurgingData ? (
                <span className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              )}
              <span>{isPurgingData ? 'Purging Fake Data...' : 'Remove Fake Data'}</span>
            </button>

            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>

            <button
              onClick={handleAdminLogout}
              disabled={isLoggingOut}
              className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 hover:border-red-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Sign out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
                <span className="text-xs text-gray-500 font-semibold">Total Farmers</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-950">{totalFarmers}</p>
                <span className="text-[11px] text-emerald-700 font-medium">Registered Cultivators</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
                <span className="text-xs text-gray-500 font-semibold">Total Land Owners</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-950">{totalLandOwners}</p>
                <span className="text-[11px] text-emerald-700 font-medium">Agricultural Owners</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
                <span className="text-xs text-gray-500 font-semibold">Total Available Lands</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-950">{totalAvailableLands}</p>
                <span className="text-[11px] text-emerald-700 font-medium">Ready for Lease</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
                <span className="text-xs text-gray-500 font-semibold">Active Farming Work</span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600">{totalActiveFarmingWork}</p>
                <span className="text-[11px] text-amber-700 font-medium">Ongoing Leases</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1 sm:col-span-2 xl:col-span-1">
                <span className="text-xs text-gray-500 font-semibold">Workers Currently Working</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700">{totalWorkersCurrentlyWorking}</p>
                <span className="text-[11px] text-emerald-700 font-medium">Active on Farmland</span>
              </div>
            </div>

            {/* Split Grid: Recently Added Farmers & Recently Added Lands */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recently Added Farmers */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-gray-900 text-sm font-serif">Recently Added Farmers</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('farmers')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View All ({totalFarmers}) →
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {recentlyAddedFarmers.map((f) => (
                    <div key={f.userId} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{f.name}</p>
                          <span className="text-gray-500 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {f.location || 'India'} • Exp: {f.farmingExperience || '3 yrs'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedFarmerForDetails(f)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Added Lands */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-gray-900 text-sm font-serif">Recently Added Farmlands</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('lands')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View All ({lands.length}) →
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {recentlyAddedLands.map((l) => {
                    const assignedWorkersCount = farmingWorks.filter(
                      (w) => w.landId === l.id && w.status === 'active'
                    ).length;

                    return (
                      <div key={l.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{l.title}</p>
                          <span className="text-gray-500 text-[11px] block">
                            {l.sizeAcres} Ac • Owner: {l.ownerName} • {l.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                            {assignedWorkersCount} Worker{assignedWorkersCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => setSelectedLandForWorkers(l)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition"
                          >
                            Workers
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Platform Activity */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-gray-900 text-sm font-serif">Live Platform Activity Log</h3>
                </div>
                <span className="text-xs text-gray-400">Real-time DB Transactions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-900">{act.title}</p>
                      <p className="text-gray-500 text-[11px]">{act.desc}</p>
                      <span className="text-[10px] text-gray-400 block pt-0.5">
                        {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${act.badgeColor}`}>
                      {act.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARMERS MANAGEMENT */}
        {activeTab === 'farmers' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-serif">Registered Cultivators & Farmers</h2>
                <p className="text-xs text-gray-500">
                  Inspect farmer skills, past and ongoing cultivation agreements, and account statuses.
                </p>
              </div>
            </div>

            {/* Mobile Farmer Cards */}
            <div className="md:hidden space-y-3">
              {users.filter((u) => u.role === 'farmer').map((farmer) => {
                const activeWork = farmingWorks.find(
                  (w) => w.farmerId === farmer.userId && w.status === 'active'
                );

                return (
                  <div key={farmer.userId} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {farmer.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block leading-tight">{farmer.name}</span>
                          <span className="text-[11px] text-gray-500">{farmer.email}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          farmer.isDisabled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {farmer.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="font-semibold text-gray-800">{farmer.phone || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-gray-700">{farmer.location || 'India'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Experience:</span>
                        <span className="font-semibold text-gray-800">{farmer.farmingExperience || '3 yrs'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Land:</span>
                        <span className="font-bold text-emerald-900 text-right">
                          {activeWork ? `${activeWork.landTitle} (${activeWork.landSize} Ac)` : 'None'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedFarmerForDetails(farmer)}
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs text-center transition min-h-[40px] flex items-center justify-center"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setUserToToggleStatus(farmer)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition min-h-[40px] flex items-center justify-center ${
                          farmer.isDisabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {farmer.isDisabled ? 'Restore' : 'Disable'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-50/70 text-emerald-950 uppercase font-bold">
                  <tr>
                    <th className="p-3">Farmer Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Experience & Skills</th>
                    <th className="p-3">Active Farmland</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.filter((u) => u.role === 'farmer').map((farmer) => {
                    const activeWork = farmingWorks.find(
                      (w) => w.farmerId === farmer.userId && w.status === 'active'
                    );

                    return (
                      <tr key={farmer.userId} className="hover:bg-gray-50/80 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                              {farmer.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block">{farmer.name}</span>
                              <span className="text-[10px] text-gray-400">{farmer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-700 font-medium">{farmer.phone || '—'}</td>
                        <td className="p-3 text-gray-600">{farmer.location || 'India'}</td>
                        <td className="p-3 text-gray-600">
                          <strong>{farmer.farmingExperience || '3 yrs'}</strong>
                          <span className="block text-[10px] text-gray-400 truncate max-w-[150px]">
                            {farmer.skills || 'Paddy, Drip'}
                          </span>
                        </td>
                        <td className="p-3">
                          {activeWork ? (
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {activeWork.landTitle} ({activeWork.landSize} Ac)
                            </span>
                          ) : (
                            <span className="text-gray-400">None (Available)</span>
                          )}
                        </td>
                        <td className="p-3">
                          {farmer.isDisabled ? (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Disabled
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedFarmerForDetails(farmer)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-800 transition"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => setUserToToggleStatus(farmer)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              farmer.isDisabled
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {farmer.isDisabled ? 'Restore' : 'Disable'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LAND OWNERS */}
        {activeTab === 'landowners' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 font-serif">Registered Land Owners</h2>
              <p className="text-xs text-gray-500">
                Directory of agricultural landowners who list farmlands for cultivator discovery.
              </p>
            </div>

            {/* Mobile Land Owner Cards */}
            <div className="md:hidden space-y-3">
              {users.filter((u) => u.role === 'land_owner').map((owner) => {
                const ownerLands = lands.filter((l) => l.ownerId === owner.userId);

                return (
                  <div key={owner.userId} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {owner.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block leading-tight">{owner.name}</span>
                          <span className="text-[11px] text-gray-500">{owner.email}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          owner.isDisabled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {owner.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="font-semibold text-gray-800">{owner.phone || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-gray-700">{owner.location || 'India'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Farmlands Listed:</span>
                        <span className="font-bold text-emerald-950">
                          {ownerLands.length} Parcel{ownerLands.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => setUserToToggleStatus(owner)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition min-h-[40px] flex items-center justify-center ${
                          owner.isDisabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {owner.isDisabled ? 'Restore Account' : 'Disable Account'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-amber-50/70 text-amber-950 uppercase font-bold">
                  <tr>
                    <th className="p-3">Owner Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Lands Listed</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.filter((u) => u.role === 'land_owner').map((owner) => {
                    const ownerLands = lands.filter((l) => l.ownerId === owner.userId);

                    return (
                      <tr key={owner.userId} className="hover:bg-gray-50/80 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                              {owner.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block">{owner.name}</span>
                              <span className="text-[10px] text-gray-400">{owner.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-700 font-medium">{owner.phone || '—'}</td>
                        <td className="p-3 text-gray-600">{owner.location || 'India'}</td>
                        <td className="p-3 font-bold text-emerald-950">
                          {ownerLands.length} Farmland{ownerLands.length !== 1 ? 's' : ''}
                        </td>
                        <td className="p-3">
                          {owner.isDisabled ? (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Disabled
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => setUserToToggleStatus(owner)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              owner.isDisabled
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {owner.isDisabled ? 'Restore' : 'Disable'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FARMLANDS & LAND-WISE WORKERS */}
        {activeTab === 'lands' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-serif">Farmlands & Assigned Workers</h2>
                <p className="text-xs text-gray-500">
                  Inspect any farmland listing to view the assigned farmers working on that plot.
                </p>
              </div>
              <button
                onClick={handlePurgeFakeData}
                disabled={isPurgingData}
                className="self-start sm:self-auto bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Scan and delete all fake or seed farmland records from the database"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>{isPurgingData ? 'Purging Fake Data...' : 'Remove Fake Data from DB'}</span>
              </button>
            </div>

            {/* Mobile Farmlands Cards */}
            <div className="md:hidden space-y-3">
              {lands.map((land) => {
                const assignedWorkers = farmingWorks.filter(
                  (w) => w.landId === land.id && w.status === 'active'
                );

                return (
                  <div key={land.id} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{land.title}</h4>
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {land.location}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          land.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {land.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Land Owner:</span>
                        <span className="font-semibold text-gray-800">{land.ownerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size & Rent:</span>
                        <span className="font-bold text-emerald-950">
                          {land.sizeAcres} Ac • ₹{land.rentAmount.toLocaleString()}/{land.rentPeriod}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-gray-400">Active Workers:</span>
                        <button
                          onClick={() => setSelectedLandForWorkers(land)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px]"
                        >
                          <Users className="w-3 h-3" />
                          <span>{assignedWorkers.length} Worker{assignedWorkers.length !== 1 ? 's' : ''}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedLandForWorkers(land)}
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs text-center transition min-h-[40px] flex items-center justify-center"
                      >
                        Workers ({assignedWorkers.length})
                      </button>
                      <button
                        onClick={() => onSelectLand(land.id)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="View Public Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLandToDelete(land)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Remove Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-50/70 text-emerald-950 uppercase font-bold">
                  <tr>
                    <th className="p-3">Land Title</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Size & Rent</th>
                    <th className="p-3">Active Workers</th>
                    <th className="p-3">Availability</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lands.map((land) => {
                    const assignedWorkers = farmingWorks.filter(
                      (w) => w.landId === land.id && w.status === 'active'
                    );

                    return (
                      <tr key={land.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3 font-bold text-gray-900 max-w-[200px] truncate">
                          {land.title}
                        </td>
                        <td className="p-3 text-gray-700 font-medium">{land.ownerName}</td>
                        <td className="p-3 text-gray-600">{land.location}</td>
                        <td className="p-3">
                          <strong>{land.sizeAcres} Ac</strong> • ₹{land.rentAmount.toLocaleString()}/{land.rentPeriod}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedLandForWorkers(land)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{assignedWorkers.length} Worker{assignedWorkers.length !== 1 ? 's' : ''}</span>
                          </button>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              land.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {land.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedLandForWorkers(land)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-800"
                            title="Inspect Land Workers"
                          >
                            Workers
                          </button>
                          <button
                            onClick={() => onSelectLand(land.id)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            title="Public Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setLandToDelete(land)}
                            className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600"
                            title="Remove Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: WORKERS / FARMING WORKERS (STAFF MANAGEMENT) */}
        {activeTab === 'workers' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-serif">Workers & Farming Staff Management</h2>
                <p className="text-xs text-gray-500">
                  Track every worker, current land, landowner, date joined, and manage active cultivation statuses.
                </p>
              </div>

              {/* Status Filter Pill */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
                {['All', 'Working', 'Available', 'Completed', 'Inactive'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setWorkerStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                      workerStatusFilter === st
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Worker Cards (md:hidden) */}
            <div className="md:hidden space-y-3.5">
              {filteredWorkers.map(({ farmer, activeWork, status }) => (
                <div key={farmer.userId} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {farmer.photoUrl ? (
                          <img src={farmer.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          farmer.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-sm block leading-tight">{farmer.name}</span>
                        <span className="text-[11px] text-gray-500">{farmer.phone || farmer.email}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        status === 'Working'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'Available'
                          ? 'bg-blue-100 text-blue-800'
                          : status === 'Completed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Land:</span>
                      <span className="font-bold text-emerald-950 text-right">
                        {activeWork ? activeWork.landTitle : <span className="text-gray-400 italic font-normal">None (Available)</span>}
                      </span>
                    </div>
                    {activeWork && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Land Owner:</span>
                          <span className="font-semibold text-gray-800 text-right">{activeWork.ownerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Crop Planted:</span>
                          <span className="font-medium text-emerald-800 text-right">{activeWork.cropPlanted} ({activeWork.landSize} Ac)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date Joined:</span>
                          <span className="text-gray-700 text-right">{activeWork.startDate}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-gray-700">{farmer.location || 'India'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Experience:</span>
                      <span className="font-semibold text-gray-800">{farmer.farmingExperience || '3+ yrs'}</span>
                    </div>
                    {farmer.skills && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Skills:</span>
                        <span className="font-medium text-gray-700 text-right truncate max-w-[170px]">{farmer.skills}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedFarmerForDetails(farmer)}
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs text-center transition min-h-[40px] flex items-center justify-center"
                    >
                      View Profile
                    </button>
                    {activeWork && (
                      <button
                        onClick={() => setWorkToRemove(activeWork)}
                        className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs text-center transition min-h-[40px] flex items-center justify-center"
                      >
                        Unassign Worker
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Workers Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-950 text-white uppercase font-bold">
                  <tr>
                    <th className="p-3">Worker / Farmer</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Experience & Skills</th>
                    <th className="p-3">Current Land</th>
                    <th className="p-3">Land Owner</th>
                    <th className="p-3">Date Joined</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWorkers.map(({ farmer, activeWork, status }) => (
                    <tr key={farmer.userId} className="hover:bg-gray-50/80 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                            {farmer.photoUrl ? (
                              <img src={farmer.photoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              farmer.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{farmer.name}</span>
                            <span className="text-[10px] text-gray-400">{farmer.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-gray-700 font-medium">
                        {farmer.phone || '—'}
                      </td>

                      <td className="p-3 text-gray-600">{farmer.location || 'India'}</td>

                      <td className="p-3 text-gray-600">
                        <span className="font-semibold block">{farmer.farmingExperience || '3+ yrs'}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[130px] block">
                          {farmer.skills || 'General cultivation'}
                        </span>
                      </td>

                      <td className="p-3">
                        {activeWork ? (
                          <div>
                            <span className="font-bold text-emerald-900 block">{activeWork.landTitle}</span>
                            <span className="text-[10px] text-gray-500">{activeWork.landSize} Ac • {activeWork.cropPlanted}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No active land</span>
                        )}
                      </td>

                      <td className="p-3 text-gray-700 font-medium">
                        {activeWork ? activeWork.ownerName : '—'}
                      </td>

                      <td className="p-3 text-gray-600">
                        {activeWork ? activeWork.startDate : '—'}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            status === 'Working'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'Available'
                              ? 'bg-blue-100 text-blue-800'
                              : status === 'Completed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedFarmerForDetails(farmer)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] transition"
                        >
                          Profile
                        </button>

                        {activeWork && (
                          <button
                            onClick={() => setWorkToRemove(activeWork)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[10px] transition"
                            title="Remove from current farmland"
                          >
                            Unassign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: INSURANCE APPLICATIONS */}
        {activeTab === 'insurance' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 font-serif">Life Insurance Moderation</h2>
              <p className="text-xs text-gray-500">
                Official insurance applications submitted by farmers and landowners for PMJJBY and LIC schemes.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {insuranceApps.map((app) => (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{app.policyName}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Applicant: <strong>{app.userName}</strong> ({app.userRole}) • Phone: {app.userPhone}
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      Nominee: <strong>{app.nomineeName}</strong> ({app.nomineeRelation}) • Coverage: {app.coverageSelected}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, 'insurance_applications', app.id), {
                          status: 'approved',
                          updatedAt: new Date().toISOString(),
                        });
                        showToast('Insurance application marked as Approved.');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-xl text-xs hover:bg-emerald-800"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, 'insurance_applications', app.id), {
                          status: 'rejected',
                          updatedAt: new Date().toISOString(),
                        });
                        showToast('Insurance application marked as Rejected.');
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: LOANS */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 font-serif">Agricultural Loan Inquiries</h2>
              <p className="text-xs text-gray-500">
                KCC and equipment credit requests for institutional lender recommendation.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {loanApps.map((loan) => (
                <div key={loan.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{loan.loanSchemeName}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {loan.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Applicant: <strong>{loan.userName}</strong> • Requested Amount: <strong className="text-emerald-950">₹{loan.amountRequested.toLocaleString()}</strong>
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      Purpose: {loan.purpose} • Tenure: {loan.tenureMonths} Mos • Land Ref: {loan.landReference}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, 'loan_applications', loan.id), {
                          status: 'recommended',
                          updatedAt: new Date().toISOString(),
                        });
                        showToast('Loan inquiry marked as Recommended to Bank.');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-xl text-xs hover:bg-emerald-800"
                    >
                      Recommend
                    </button>
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, 'loan_applications', loan.id), {
                          status: 'rejected',
                          updatedAt: new Date().toISOString(),
                        });
                        showToast('Loan inquiry marked as Rejected.');
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SEED SUPPORT */}
        {activeTab === 'seeds' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 font-serif">Certified Seed Distribution Requests</h2>
              <p className="text-xs text-gray-500">
                Certified high-yield seed requests for Kharif, Rabi, and Zaid seasons.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {seedRequests.map((s) => (
                <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{s.cropType}</span>
                      <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {s.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Farmer: <strong>{s.userName}</strong> • Quantity: <strong>{s.quantityBags} Bags</strong> • Season: {s.season}
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      Delivery Address: {s.deliveryAddress}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, 'seed_support_requests', s.id), {
                          status: 'dispatched',
                          updatedAt: new Date().toISOString(),
                        });
                        showToast('Seed allocation marked as Dispatched.');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-xl text-xs hover:bg-emerald-800"
                    >
                      Dispatch
                    </button>
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, 'seed_support_requests', s.id), {
                          status: 'completed',
                          updatedAt: new Date().toISOString(),
                        });
                        showToast('Seed allocation marked as Delivered/Completed.');
                      }}
                      className="px-3 py-1.5 bg-blue-700 text-white font-bold rounded-xl text-xs hover:bg-blue-800"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: REPORTS & MODERATION */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 font-serif">Reported Listings & Problematic Accounts</h2>
              <p className="text-xs text-gray-500">
                User and community reports regarding inaccurate farmland boundaries or problematic conduct.
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-gray-800 text-sm">No Pending Community Reports</p>
                <p className="text-gray-400">All farmlands and users are in good standing.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reports.map((rep) => (
                  <div key={rep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{rep.targetTitle}</span>
                      <p className="text-gray-600 mt-1">
                        Reported By: {rep.reportedByName || rep.reportedBy} • Reason: <strong>{rep.reason}</strong>
                      </p>
                      <span className="text-[10px] text-gray-400">Filed on: {new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, 'reports', rep.id), { status: 'resolved' });
                          showToast('Report marked as Resolved');
                        }}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-bold text-xs"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={async () => {
                          await deleteDoc(doc(db, 'reports', rep.id));
                          showToast('Report dismissed');
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 10: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-serif">System Broadcast Notifications</h2>
                <p className="text-xs text-gray-500">
                  Audit notifications sent to farmers and land owners across India.
                </p>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Broadcast Notice
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 15).map((n) => (
                <div key={n.id} className="py-3 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900">{n.title}</p>
                    <p className="text-gray-600">{n.message}</p>
                    <span className="text-[10px] text-gray-400">
                      User: {n.userId} • {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {n.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs max-w-2xl mx-auto space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 font-serif">Admin Security & Environment</h2>
              <p className="text-xs text-gray-500">
                Verified administrative configuration and database access rules.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Primary Administrator</span>
                <p className="font-bold text-gray-900 text-sm">{currentUser?.email}</p>
                <p className="text-gray-600">
                  Role: Super Administrator with unrestricted moderation privileges over farmland listings, workers, and user profiles.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-600">Database Engine</span>
                <p className="font-bold text-gray-900">Firebase Firestore Enterprise Instance</p>
                <p className="text-gray-600">
                  Security rules strictly enforced: unauthorized users cannot modify RBAC roles, inject invalid fields, or access restricted staff endpoints.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: LAND-WISE WORKERS MODAL (When Admin opens a land listing) */}
      {selectedLandForWorkers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Land Details → Workers
                </span>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 font-serif mt-1">
                  {selectedLandForWorkers.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Land Owner: <strong>{selectedLandForWorkers.ownerName}</strong> • Location: <strong>{selectedLandForWorkers.location}</strong> • Size: <strong>{selectedLandForWorkers.sizeAcres} Acres</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedLandForWorkers(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workers currently working on this land */}
            {(() => {
              const landWorkers = farmingWorks.filter(
                (w) => w.landId === selectedLandForWorkers.id
              );
              const activeWorkers = landWorkers.filter((w) => w.status === 'active');
              const pastWorkers = landWorkers.filter((w) => w.status !== 'active');

              return (
                <div className="space-y-5">
                  {/* Summary Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-emerald-50/70 p-3.5 sm:p-4 rounded-2xl border border-emerald-100 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Active Workers:</span>
                      <strong className="text-emerald-950 text-base">{activeWorkers.length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Total History:</span>
                      <strong className="text-emerald-950 text-base">{landWorkers.length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Agreed Rent:</span>
                      <strong className="text-emerald-950 text-base">₹{selectedLandForWorkers.rentAmount.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Active Workers List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm">
                      Farmers Currently Cultivating This Land ({activeWorkers.length})
                    </h4>

                    {activeWorkers.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500">
                        No farmers are currently assigned to this plot. It is available for lease discovery.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activeWorkers.map((w) => (
                          <div
                            key={w.id}
                            className="p-3.5 sm:p-4 rounded-2xl border border-emerald-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{w.farmerName}</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {w.status}
                                </span>
                              </div>
                              <p className="text-gray-600">
                                Contact: <strong>{w.farmerPhone || 'Registered in DB'}</strong> • Crop: <strong>{w.cropPlanted}</strong>
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Joined Date: {w.startDate} • Rent: ₹{w.landRent.toLocaleString()}
                              </p>
                              {w.notes && (
                                <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                                  Notes: {w.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateWorkStatus(w.id, 'completed')}
                                className="flex-1 sm:flex-initial px-3 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 min-h-[38px]"
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => setWorkToRemove(w)}
                                className="flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 min-h-[38px]"
                              >
                                Remove Worker
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Workers / Historical record */}
                  {pastWorkers.length > 0 && (
                    <div className="space-y-2.5 pt-4 border-t border-gray-100">
                      <h4 className="font-bold text-gray-600 text-xs">
                        Previous Cultivators on this Farmland ({pastWorkers.length})
                      </h4>
                      <div className="space-y-2">
                        {pastWorkers.map((pw) => (
                          <div
                            key={pw.id}
                            className="p-3 bg-gray-50 rounded-xl text-xs flex items-center justify-between text-gray-600"
                          >
                            <div>
                              <strong>{pw.farmerName}</strong> • {pw.cropPlanted} ({pw.startDate})
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500">
                              {pw.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLandForWorkers(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FARMER DETAILS MODAL (Admin inspection) */}
      {selectedFarmerForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedFarmerForDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 font-serif leading-tight">
                    {selectedFarmerForDetails.name}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedFarmerForDetails.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFarmerForDetails(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-gray-50 p-3.5 sm:p-4 rounded-2xl text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Phone Number</span>
                <span className="font-bold text-gray-800">{selectedFarmerForDetails.phone || 'Not shared'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Location</span>
                <span className="font-bold text-gray-800">{selectedFarmerForDetails.location || 'India'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Farming Experience</span>
                <span className="font-bold text-emerald-950">{selectedFarmerForDetails.farmingExperience || '3+ years'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Account Standing</span>
                <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] ${
                  selectedFarmerForDetails.isDisabled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedFarmerForDetails.isDisabled ? 'Disabled' : 'Good Standing'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-gray-700">Specialized Skills:</span>
              <p className="text-gray-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                {selectedFarmerForDetails.skills || 'Crop rotation, drip irrigation, pest monitoring, harvesting'}
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-gray-700">Preferred Crops:</span>
              <p className="text-gray-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                {selectedFarmerForDetails.preferredCrops || 'Paddy, Cotton, Maize, Vegetables'}
              </p>
            </div>

            {/* Current & Past Farming Work */}
            {(() => {
              const activeWork = farmingWorks.find(
                (w) => w.farmerId === selectedFarmerForDetails.userId && w.status === 'active'
              );
              const pastWorks = farmingWorks.filter(
                (w) => w.farmerId === selectedFarmerForDetails.userId && w.status !== 'active'
              );

              return (
                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-gray-900 text-sm">Farming Work History</h4>

                  {activeWork ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Current Active Farmland</span>
                      <p className="font-bold text-gray-900 text-sm">{activeWork.landTitle} ({activeWork.landSize} Acres)</p>
                      <p className="text-gray-600">Land Owner: <strong>{activeWork.ownerName}</strong> • Crop: {activeWork.cropPlanted}</p>
                      <p className="text-[11px] text-gray-500">Joined: {activeWork.startDate} • Rent: ₹{activeWork.landRent.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl">
                      Currently available with no active cultivation lease.
                    </p>
                  )}

                  {pastWorks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-700">Previous Farmlands ({pastWorks.length}):</span>
                      {pastWorks.map((pw) => (
                        <div key={pw.id} className="p-3 bg-gray-50 rounded-xl text-xs flex justify-between items-center text-gray-600">
                          <span>{pw.landTitle} ({pw.cropPlanted})</span>
                          <span className="text-[10px] font-bold uppercase">{pw.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setUserToToggleStatus(selectedFarmerForDetails);
                  setSelectedFarmerForDetails(null);
                }}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                {selectedFarmerForDetails.isDisabled ? 'Restore Account' : 'Disable Farmer Account'}
              </button>

              <button
                onClick={() => setSelectedFarmerForDetails(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION: REMOVE WORKER MODAL */}
      <ConfirmationModal
        isOpen={!!workToRemove}
        title="Conclude Worker Arrangement"
        message={`Are you sure you want to unassign ${workToRemove?.farmerName} from "${workToRemove?.landTitle}"? The worker count will update, the farmland will become available for new cultivators, and the historical log will be preserved.`}
        confirmLabel="Confirm Unassign"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isProcessingAction}
        onConfirm={handleConfirmRemoveWorker}
        onCancel={() => setWorkToRemove(null)}
      />

      {/* CONFIRMATION: DELETE LAND MODAL */}
      <ConfirmationModal
        isOpen={!!landToDelete}
        title="Delete Farmland Listing"
        message={`Are you sure you want to permanently delete "${landToDelete?.title}" from the platform? It will be removed from the database and immediately cease showing to farmers.`}
        confirmLabel="Delete Farmland"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isProcessingAction}
        onConfirm={handleConfirmDeleteLand}
        onCancel={() => setLandToDelete(null)}
      />

      {/* CONFIRMATION: TOGGLE USER DISABLED STATUS */}
      <ConfirmationModal
        isOpen={!!userToToggleStatus}
        title={userToToggleStatus?.isDisabled ? 'Restore User Account' : 'Disable User Account'}
        message={`Are you sure you want to ${userToToggleStatus?.isDisabled ? 'restore access for' : 'disable the account of'} "${userToToggleStatus?.name}"?`}
        confirmLabel={userToToggleStatus?.isDisabled ? 'Restore Access' : 'Disable Account'}
        cancelLabel="Cancel"
        isDestructive={!userToToggleStatus?.isDisabled}
        isLoading={isProcessingAction}
        onConfirm={handleToggleUserDisabled}
        onCancel={() => setUserToToggleStatus(null)}
      />

      {/* MODAL: BROADCAST SYSTEM NOTIFICATION */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base font-serif">Broadcast System Notice</h3>
                <p className="text-xs text-gray-500">Dispatch in-app notifications to registered users.</p>
              </div>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastNotification} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Target Audience</label>
                <select
                  value={broadcastTargetRole}
                  onChange={(e) => setBroadcastTargetRole(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="all">All Registered Users (Farmers & Land Owners)</option>
                  <option value="farmer">Farmers Only</option>
                  <option value="land_owner">Land Owners Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Kharif Season Subsidized Seed Allocation Open"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Message Body *</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Provide instructions, government updates, or lease announcements..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 flex items-center gap-1.5"
                >
                  {isBroadcasting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
