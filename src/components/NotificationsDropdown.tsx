import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';

interface NotificationsDropdownProps {
  onNavigate?: (page: string) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: NotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<NotificationItem, 'id'>) });
        });
        // Sort descending by createdAt
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'notifications');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-emerald-900 hover:bg-emerald-100/70 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-emerald-800" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-emerald-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-3.5 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-300" />
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-emerald-700 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-200 hover:text-white flex items-center gap-1 font-medium transition"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-emerald-50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Updates about lands, farming leases, loans and insurance will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) markAsRead(item.id);
                      if (item.link && onNavigate) {
                        onNavigate(item.link);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 hover:bg-emerald-50/50 cursor-pointer transition flex items-start gap-3 ${
                      !item.read ? 'bg-emerald-50/30' : 'opacity-85'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                        !item.read ? 'bg-emerald-600' : 'bg-transparent'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs ${!item.read ? 'font-bold text-emerald-950' : 'font-medium text-gray-800'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
