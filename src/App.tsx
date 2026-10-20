/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NewRequestModal } from './components/NewRequestModal';
import { RequestDetailModal } from './components/RequestDetailModal';
import { EditRequestModal } from './components/EditRequestModal';
import { ServiceRequest, RequestStatus } from './types';
import {
  db,
  handleFirestoreError,
  OperationType,
} from './firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  getDocs,
  limit,
} from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const SEED_DATA: Omit<ServiceRequest, 'id'>[] = [
  {
    userId: 'sample_citizen_1',
    userName: 'David Mwangi',
    userEmail: 'david.m@example.com',
    category: 'Broken Streetlight',
    location: 'Corner of Harambee Ave & 4th Street',
    description: 'Streetlight pole #42 has been flickering continuously for 4 days, causing visibility hazards at the pedestrian crossing.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    userId: 'sample_citizen_2',
    userName: 'Amina Hassan',
    userEmail: 'amina.h@example.com',
    category: 'Water & Sewage',
    location: 'Estate Gate B, Pipeline Road',
    description: 'Burst municipal water main leaking clean water across the road for past 24 hours. Pressure in neighboring houses is low.',
    status: 'In Progress',
    adminNote: 'Water services maintenance team #3 dispatched to replace cracked main valve.',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    userId: 'sample_citizen_3',
    userName: 'Peter Ochieng',
    userEmail: 'peter.o@example.com',
    category: 'Garbage Collection',
    location: 'Market Sector 3, Waste Bay',
    description: 'Public waste bin container is overflowing onto the walkway, attracting pests.',
    status: 'Resolved',
    adminNote: 'Sanitation contractor cleared waste bin and disinfected surrounding curb area.',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const MainApp: React.FC = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miniecitizen_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Requests state
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('miniecitizen_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('miniecitizen_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Role-based protection: if citizen tries to navigate to admin tab, redirect
  useEffect(() => {
    if (!isAdmin && (currentTab === 'admin-requests' || currentTab === 'analytics')) {
      setCurrentTab('dashboard');
    }
  }, [isAdmin, currentTab]);

  // When an admin signs in, direct them directly to the admin management page
  useEffect(() => {
    if (user && isAdmin) {
      setCurrentTab('admin-requests');
    }
  }, [user?.uid, isAdmin]);

  // Firestore Data Synchronization
  useEffect(() => {
    if (!user) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }

    setRequestsLoading(true);

    // If Admin, listen to all requests; if Citizen, query requests for this user
    const requestsRef = collection(db, 'requests');
    const q = isAdmin
      ? query(requestsRef, orderBy('createdAt', 'desc'))
      : query(requestsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ServiceRequest[] = [];
        snapshot.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<ServiceRequest, 'id'>) });
        });

        // Sort descending by creation date if client-filtered
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(loaded);
        setRequestsLoading(false);

        // Auto seed sample data on first run if database is completely empty
        if (loaded.length === 0 && isAdmin) {
          checkAndSeedStarterData();
        }
      },
      (error) => {
        console.warn('Firestore snapshot error:', error);
        handleFirestoreError(error, OperationType.LIST, 'requests');
        setRequestsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin]);

  const checkAndSeedStarterData = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'requests'), limit(1)));
      if (snap.empty) {
        for (const seed of SEED_DATA) {
          await addDoc(collection(db, 'requests'), seed);
        }
      }
    } catch (err) {
      console.warn('Could not seed initial requests:', err);
    }
  };

  // Status Update Handler (Admin or system)
  const handleUpdateStatus = async (
    req: ServiceRequest,
    newStatus: RequestStatus,
    note?: string
  ) => {
    try {
      const updateData: Partial<ServiceRequest> = {
        status: newStatus,
        adminNote: note !== undefined ? note : req.adminNote || '',
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'requests', req.id), updateData);

      // Local optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, ...updateData } : r))
      );
      if (selectedRequest && selectedRequest.id === req.id) {
        setSelectedRequest({ ...selectedRequest, ...updateData });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requests/${req.id}`);
    }
  };

  // Delete Request Handler
  const handleDeleteRequest = async (req: ServiceRequest) => {
    try {
      await deleteDoc(doc(db, 'requests', req.id));
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      showToast('Request cancelled successfully', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `requests/${req.id}`);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing mini eCitizen...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Login & Register Page
  if (!user) {
    return <AuthPage darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenNewModal={() => setIsNewModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          recentRequests={requests}
          onSelectRequest={(r) => setSelectedRequest(r)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <CitizenDashboard
              requests={requests}
              loading={requestsLoading}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              onSelectRequest={(r) => setSelectedRequest(r)}
              onViewAllRequests={() => setCurrentTab('my-requests')}
            />
          )}

          {currentTab === 'my-requests' && (
            <MyRequestsPage
              requests={requests}
              loading={requestsLoading}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              onSelectRequest={(r) => setSelectedRequest(r)}
              onEditRequest={(r) => setEditingRequest(r)}
              onDeleteRequest={handleDeleteRequest}
            />
          )}

          {currentTab === 'admin-requests' && isAdmin && (
            <AdminDashboard
              requests={requests}
              loading={requestsLoading}
              onSelectRequest={(r) => setSelectedRequest(r)}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {currentTab === 'analytics' && isAdmin && (
            <AnalyticsPage requests={requests} />
          )}

          {currentTab === 'profile' && <ProfilePage />}
        </main>
      </div>

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onRequestCreated={(created) => {
          setRequests((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
        }}
        onViewMyRequests={() => setCurrentTab('my-requests')}
      />

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onEdit={(req) => {
          setSelectedRequest(null);
          setEditingRequest(req);
        }}
        onDelete={(req) => handleDeleteRequest(req)}
        onUpdateStatus={isAdmin ? handleUpdateStatus : undefined}
      />

      {/* Edit Request Modal */}
      <EditRequestModal
        request={editingRequest}
        isOpen={Boolean(editingRequest)}
        onClose={() => setEditingRequest(null)}
        onRequestUpdated={(updated) => {
          setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          if (selectedRequest && selectedRequest.id === updated.id) {
            setSelectedRequest(updated);
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
