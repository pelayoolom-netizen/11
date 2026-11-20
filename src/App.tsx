import React, { useEffect, useState } from 'react';
import { deleteUser, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import {
  computeBadges,
  formatAxesSummaryText,
  getEloLevel,
} from './lib/perspectives';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { AuthScreen, OnboardingProfile } from './components/AuthViews';
import { DashboardLayout, type DashboardTab } from './components/DashboardLayout';
import {
  DebateHistoryView,
  OverviewView,
  SettingsView,
} from './components/DashboardViews';
import { IdeologicalTestView } from './components/IdeologicalTestView';
import { IdeologicalProfileView } from './components/IdeologicalProfileView';
import { TopicLibraryView } from './components/TopicLibraryView';
import { MatchmakingView } from './components/MatchmakingView';
import { GroupDebatesView } from './components/GroupDebatesView';
import { FriendsRoomsView } from './components/FriendsRoomsView';
import { AITrainerView } from './components/AITrainerView';
import { KnowledgeHubView } from './components/KnowledgeHubView';
import { CalendarNotificationsView } from './components/CalendarNotificationsView';
import { VideoDebateRoom } from './components/VideoDebateRoom';
import { BrandLockup } from './components/BrandMark';
import type {
  AnswerValue,
  AppView,
  AvailabilityStatus,
  DebateSession,
  IdeologicalProfile,
  MatchFoundEvent,
  NineAxes,
  PoliticalArea,
  ProposedTopicItem,
  PublicProfile,
  TestMode,
  TestProgress,
  UserAccount,
  UserNotificationItem,
} from './types';

function AntirrathetoApp() {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [ideologicalProfile, setIdeologicalProfile] =
    useState<IdeologicalProfile | null>(null);
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [loadingDebates, setLoadingDebates] = useState(true);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [proposedTopics, setProposedTopics] = useState<ProposedTopicItem[]>([]);

  const [view, setView] = useState<AppView>('landing');
  const [activeMatch, setActiveMatch] = useState<MatchFoundEvent | null>(null);
  const [prefilledTopic, setPrefilledTopic] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setUserAccount(null);
        setPublicProfile(null);
        setIdeologicalProfile(null);
        setTestProgress(null);
        setProfileLoaded(false);
        setDebates([]);
        setNotifications([]);
        setProposedTopics([]);
        setActiveMatch(null);
        setView((prev) =>
          prev === 'signin' || prev === 'register' ? prev : 'landing'
        );
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    setProfileLoaded(false);

    let gotUser = false;
    let gotPub = false;
    const markReady = () => {
      if (gotUser && gotPub) setProfileLoaded(true);
    };

    const unsubUser = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        setUserAccount(snap.exists() ? (snap.data() as UserAccount) : null);
        gotUser = true;
        markReady();
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`)
    );

    const unsubPub = onSnapshot(
      doc(db, 'public_profiles', firebaseUser.uid),
      (snap) => {
        setPublicProfile(snap.exists() ? (snap.data() as PublicProfile) : null);
        gotPub = true;
        markReady();
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `public_profiles/${firebaseUser.uid}`)
    );

    const unsubIdeo = onSnapshot(
      doc(db, 'ideological_profiles', firebaseUser.uid),
      (snap) => {
        setIdeologicalProfile(
          snap.exists() ? (snap.data() as IdeologicalProfile) : null
        );
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `ideological_profiles/${firebaseUser.uid}`)
    );

    const unsubProgress = onSnapshot(
      doc(db, 'test_progress', firebaseUser.uid),
      (snap) => {
        setTestProgress(snap.exists() ? (snap.data() as TestProgress) : null);
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `test_progress/${firebaseUser.uid}`)
    );

    setLoadingDebates(true);
    const unsubDebates = onSnapshot(
      query(
        collection(db, 'debates'),
        where('participantIds', 'array-contains', firebaseUser.uid)
      ),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as DebateSession)
          .sort((a, b) => {
            const ta = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            const tb = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            return tb - ta;
          });
        setDebates(list);
        setLoadingDebates(false);
      },
      (err) => {
        setLoadingDebates(false);
        handleFirestoreError(err, OperationType.LIST, 'debates');
      }
    );

    const unsubNotifs = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('recipientUid', '==', firebaseUser.uid)
      ),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as UserNotificationItem)
          .sort((a, b) => {
            const ta = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            const tb = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            return tb - ta;
          });
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    const unsubProposals = onSnapshot(
      query(
        collection(db, 'proposed_topics'),
        where('authorUid', '==', firebaseUser.uid)
      ),
      (snap) => {
        setProposedTopics(snap.docs.map((d) => d.data() as ProposedTopicItem));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'proposed_topics')
    );

    return () => {
      unsubUser();
      unsubPub();
      unsubIdeo();
      unsubProgress();
      unsubDebates();
      unsubNotifs();
      unsubProposals();
    };
  }, [authReady, firebaseUser]);

  useEffect(() => {
    if (
      firebaseUser &&
      userAccount &&
      publicProfile &&
      (view === 'signin' || view === 'register')
    ) {
      setView('overview');
    }
  }, [firebaseUser, userAccount, publicProfile, view]);

  const handleCompleteOnboarding = async (data: {
    username: string;
    displayName: string;
    country: string;
    city: string;
    languages: string[];
    isPublicProfile: boolean;
    showAxesPublicly: boolean;
    startTestNow: boolean;
  }) => {
    if (!firebaseUser) return;
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email || userAccount?.email || '',
        username: data.username,
        displayName: data.displayName,
        ...(userAccount?.photoURL ? { photoURL: userAccount.photoURL } : {}),
        country: data.country,
        city: data.city,
        bio: userAccount?.bio || '',
        languages: data.languages,
        favoriteTopics: userAccount?.favoriteTopics || [],
        friendUids: userAccount?.friendUids || [],
        blockedUids: userAccount?.blockedUids || [],
        recentOpponents: userAccount?.recentOpponents || [],
        availability: userAccount?.availability || 'available',
        isPublicProfile: data.isPublicProfile,
        showAxesPublicly: data.showAxesPublicly,
        aiConsentAccepted: Boolean(userAccount?.aiConsentAccepted),
        createdAt: userAccount?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'public_profiles', firebaseUser.uid), {
        uid: firebaseUser.uid,
        username: data.username,
        displayName: data.displayName,
        ...(userAccount?.photoURL ? { photoURL: userAccount.photoURL } : {}),
        country: data.country,
        city: data.city,
        bio: userAccount?.bio || '',
        languages: data.languages,
        availability: userAccount?.availability || 'available',
        elo: publicProfile?.elo || 1200,
        level: publicProfile?.level || getEloLevel(1200),
        debatesCount: publicProfile?.debatesCount || 0,
        streak: publicProfile?.streak || 0,
        badges: publicProfile?.badges || [],
        isPublicProfile: data.isPublicProfile,
        showAxesPublicly: data.showAxesPublicly,
        updatedAt: serverTimestamp(),
      });

      setView(data.startTestNow ? 'test' : 'overview');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const handleSaveTestProgress = async (data: {
    mode: TestMode;
    currentIndex: number;
    answers: Record<string, AnswerValue>;
    priorityAreas: PoliticalArea[];
    completed: boolean;
  }) => {
    if (!firebaseUser) return;
    try {
      await setDoc(doc(db, 'test_progress', firebaseUser.uid), {
        uid: firebaseUser.uid,
        mode: data.mode,
        currentIndex: Math.max(0, Math.min(200, data.currentIndex)),
        answersJson: JSON.stringify(data.answers).slice(0, 12000),
        priorityAreas: data.priorityAreas.slice(0, 10),
        completed: data.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `test_progress/${firebaseUser.uid}`);
    }
  };

  const handleCompleteIdeologicalTest = async (data: {
    modeCompleted: TestMode;
    answeredCount: number;
    axes: NineAxes;
    convictions: string[];
    tensions: string[];
    moderateTopics: string[];
    summaryText: string;
  }) => {
    if (!firebaseUser || !userAccount) return;
    try {
      await setDoc(doc(db, 'ideological_profiles', firebaseUser.uid), {
        uid: firebaseUser.uid,
        modeCompleted: data.modeCompleted,
        answeredCount: Math.max(1, Math.min(150, data.answeredCount)),
        axes: data.axes,
        convictions: data.convictions.slice(0, 10).map((s) => s.slice(0, 200)),
        tensions: data.tensions.slice(0, 10).map((s) => s.slice(0, 320)),
        moderateTopics: data.moderateTopics.slice(0, 10).map((s) => s.slice(0, 200)),
        summaryText: data.summaryText.slice(0, 600),
        updatedAt: serverTimestamp(),
      });

      if (userAccount.showAxesPublicly) {
        await updateDoc(doc(db, 'public_profiles', firebaseUser.uid), {
          publicAxesSummary: formatAxesSummaryText(data.axes).slice(0, 240),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `ideological_profiles/${firebaseUser.uid}`
      );
    }
  };

  const handleUpdateAvailability = async (status: AvailabilityStatus) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        availability: status,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'public_profiles', firebaseUser.uid), {
        availability: status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const handleSaveAccount = async (patch: {
    displayName: string;
    photoURL: string;
    country: string;
    city: string;
    bio: string;
    languages: string[];
    isPublicProfile: boolean;
    showAxesPublicly: boolean;
  }) => {
    if (!firebaseUser || !userAccount || !publicProfile) return;
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: userAccount.email || firebaseUser.email || '',
        username: userAccount.username,
        displayName: patch.displayName.slice(0, 80),
        ...(patch.photoURL ? { photoURL: patch.photoURL.slice(0, 512) } : {}),
        country: patch.country.slice(0, 64),
        city: patch.city.slice(0, 64),
        bio: patch.bio.slice(0, 320),
        languages: patch.languages.slice(0, 6),
        favoriteTopics: (userAccount.favoriteTopics || []).slice(0, 60).map((t) => t.slice(0, 200)),
        friendUids: (userAccount.friendUids || []).slice(0, 100),
        blockedUids: (userAccount.blockedUids || []).slice(0, 100),
        recentOpponents: (userAccount.recentOpponents || []).slice(0, 20),
        availability: userAccount.availability || 'available',
        isPublicProfile: patch.isPublicProfile,
        showAxesPublicly: patch.showAxesPublicly,
        aiConsentAccepted: Boolean(userAccount.aiConsentAccepted),
        createdAt: userAccount.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const summaryPatch =
        patch.showAxesPublicly && ideologicalProfile
          ? { publicAxesSummary: formatAxesSummaryText(ideologicalProfile.axes).slice(0, 240) }
          : { publicAxesSummary: '' };

      await setDoc(doc(db, 'public_profiles', firebaseUser.uid), {
        uid: firebaseUser.uid,
        username: userAccount.username,
        displayName: patch.displayName.slice(0, 80),
        ...(patch.photoURL ? { photoURL: patch.photoURL.slice(0, 512) } : {}),
        country: patch.country.slice(0, 64),
        city: patch.city.slice(0, 64),
        bio: patch.bio.slice(0, 320),
        languages: patch.languages.slice(0, 6),
        availability: publicProfile.availability || 'available',
        elo: publicProfile.elo || 1200,
        level: publicProfile.level || getEloLevel(1200),
        debatesCount: publicProfile.debatesCount || 0,
        streak: publicProfile.streak || 0,
        badges: (publicProfile.badges || []).slice(0, 20),
        isPublicProfile: patch.isPublicProfile,
        showAxesPublicly: patch.showAxesPublicly,
        ...summaryPatch,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const handleToggleFavoriteTopic = async (topicTitle: string) => {
    if (!firebaseUser || !userAccount) return;
    const cleanTitle = topicTitle.slice(0, 200);
    const current = userAccount.favoriteTopics || [];
    const next = current.includes(cleanTitle)
      ? current.filter((t) => t !== cleanTitle)
      : [cleanTitle, ...current].slice(0, 60);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        favoriteTopics: next,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const handleSubmitTopicProposal = async (data: {
    title: string;
    description: string;
    category: PoliticalArea;
    difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  }) => {
    if (!firebaseUser || !userAccount) return;
    const topicId = `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'proposed_topics', topicId), {
        topicId,
        authorUid: firebaseUser.uid,
        authorName: userAccount.displayName.slice(0, 80),
        title: data.title.slice(0, 160),
        description: data.description.slice(0, 400),
        category: data.category,
        difficulty: data.difficulty,
        status: 'pending_moderation',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `proposed_topics/${topicId}`);
    }
  };

  const handleDebateScored = async (eloDelta: number) => {
    if (!firebaseUser || !publicProfile) return;
    const nextElo = Math.max(800, Math.min(3000, (publicProfile.elo || 1200) + eloDelta));
    const nextCount = (publicProfile.debatesCount || 0) + 1;
    const nextStreak = eloDelta >= 0 ? (publicProfile.streak || 0) + 1 : 0;
    const nextBadges = computeBadges(nextCount, nextElo, nextStreak);

    try {
      await updateDoc(doc(db, 'public_profiles', firebaseUser.uid), {
        elo: nextElo,
        level: getEloLevel(nextElo),
        debatesCount: nextCount,
        streak: nextStreak,
        badges: nextBadges,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `public_profiles/${firebaseUser.uid}`
      );
    }
  };

  const handleEnterDebateWithHistory = async (match: MatchFoundEvent) => {
    setActiveMatch(match);
    setView('call');
    if (firebaseUser && userAccount) {
      const rivalUid =
        match.host.uid === firebaseUser.uid ? match.guest.uid : match.host.uid;
      if (rivalUid) {
        const nextRecent = [
          rivalUid,
          ...(userAccount.recentOpponents || []).filter((id) => id !== rivalUid),
        ].slice(0, 10);
        updateDoc(doc(db, 'users', firebaseUser.uid), {
          recentOpponents: nextRecent,
          updatedAt: serverTimestamp(),
        }).catch(() => undefined);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await Promise.allSettled([
        deleteDoc(doc(db, 'users', uid)),
        deleteDoc(doc(db, 'public_profiles', uid)),
        deleteDoc(doc(db, 'ideological_profiles', uid)),
        deleteDoc(doc(db, 'test_progress', uid)),
        deleteDoc(doc(db, 'matchmaking_queue', uid)),
      ]);
      await deleteUser(firebaseUser);
      setView('landing');
    } catch {
      await signOut(auth);
      setView('landing');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setView('landing');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 gap-4">
        <BrandLockup />
        <p className="text-xs uppercase tracking-[0.2em] text-[#777367]">Cargando...</p>
      </div>
    );
  }

  if (firebaseUser && profileLoaded && (!userAccount || !userAccount.username || !publicProfile)) {
    return (
      <OnboardingProfile
        initialName={firebaseUser.displayName || ''}
        email={firebaseUser.email || ''}
        existingAccount={userAccount}
        onComplete={handleCompleteOnboarding}
        onSignOut={handleSignOut}
      />
    );
  }

  if (firebaseUser && !profileLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 gap-4">
        <BrandLockup />
        <p className="text-xs uppercase tracking-[0.2em] text-[#777367]">
          Preparando tu espacio de debate...
        </p>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        isAuthenticated={Boolean(firebaseUser && userAccount)}
        onStartDebating={() => {
          if (firebaseUser && userAccount) {
            setView('matchmaking');
          } else {
            setView('register');
          }
        }}
        onSignIn={() => setView('signin')}
        onRegister={() => setView('register')}
        onOpenDashboard={() => setView('overview')}
      />
    );
  }

  if (!firebaseUser && (view === 'signin' || view === 'register')) {
    return (
      <AuthScreen
        mode={view}
        onSwitchMode={(m) => setView(m)}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  if (view === 'call' && activeMatch && userAccount) {
    return (
      <VideoDebateRoom
        match={activeMatch}
        userAccount={userAccount}
        onDebateScored={handleDebateScored}
        onExitToDashboard={() => {
          setActiveMatch(null);
          setView('overview');
        }}
      />
    );
  }

  if (firebaseUser && userAccount && publicProfile) {
    const dashboardView: DashboardTab =
      view === 'signin' || view === 'register' || view === 'call'
        ? 'overview'
        : view;

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
      <DashboardLayout
        activeView={dashboardView}
        userAccount={userAccount}
        publicProfile={publicProfile}
        unreadNotifications={unreadCount}
        onNavigate={(next) => setView(next)}
        onSignOut={handleSignOut}
      >
        {dashboardView === 'overview' && (
          <OverviewView
            userAccount={userAccount}
            publicProfile={publicProfile}
            ideologicalProfile={ideologicalProfile}
            debates={debates}
            loadingDebates={loadingDebates}
            onFindDebate={() => setView('matchmaking')}
            onOpenTest={() => setView('test')}
            onOpenProfile={() => setView('profile')}
            onOpenHistory={() => setView('history')}
            onDebateTopic={(title) => {
              setPrefilledTopic(title);
              setView('matchmaking');
            }}
            onUpdateAvailability={handleUpdateAvailability}
          />
        )}

        {dashboardView === 'test' && (
          <IdeologicalTestView
            existingProgress={testProgress}
            existingProfile={ideologicalProfile}
            onSaveProgress={handleSaveTestProgress}
            onCompleteTest={handleCompleteIdeologicalTest}
            onGoToProfile={() => setView('profile')}
          />
        )}

        {dashboardView === 'profile' && (
          <IdeologicalProfileView
            userAccount={userAccount}
            profile={ideologicalProfile}
            onStartOrRetakeTest={() => setView('test')}
            onFindDebate={() => setView('matchmaking')}
            onGoToSettings={() => setView('settings')}
          />
        )}

        {dashboardView === 'matchmaking' && (
          <MatchmakingView
            userAccount={userAccount}
            publicProfile={publicProfile}
            ideologicalProfile={ideologicalProfile}
            testProgress={testProgress}
            initialTopic={prefilledTopic}
            onGoToTest={() => setView('test')}
            onEnterDebate={handleEnterDebateWithHistory}
          />
        )}

        {dashboardView === 'topics' && (
          <TopicLibraryView
            favoriteTopics={userAccount.favoriteTopics || []}
            proposedTopics={proposedTopics}
            onToggleFavorite={handleToggleFavoriteTopic}
            onDebateTopic={(title) => {
              setPrefilledTopic(title);
              setView('matchmaking');
            }}
            onTrainTopic={(title) => {
              setPrefilledTopic(title);
              setView('ai_trainer');
            }}
            onSubmitProposal={handleSubmitTopicProposal}
          />
        )}

        {dashboardView === 'groups' && <GroupDebatesView userAccount={userAccount} />}

        {dashboardView === 'ai_trainer' && (
          <AITrainerView initialTopic={prefilledTopic} />
        )}

        {dashboardView === 'friends' && (
          <FriendsRoomsView
            userAccount={userAccount}
            publicProfile={publicProfile}
            onEnterPrivateDebate={handleEnterDebateWithHistory}
          />
        )}

        {dashboardView === 'knowledge' && (
          <KnowledgeHubView
            ideologicalProfile={ideologicalProfile}
            onDebateTopic={(title) => {
              setPrefilledTopic(title);
              setView('matchmaking');
            }}
            onTrainTopic={(title) => {
              setPrefilledTopic(title);
              setView('ai_trainer');
            }}
          />
        )}

        {dashboardView === 'history' && (
          <DebateHistoryView
            userAccount={userAccount}
            debates={debates}
            loading={loadingDebates}
            onFindDebate={() => setView('matchmaking')}
          />
        )}

        {dashboardView === 'calendar' && (
          <CalendarNotificationsView
            userAccount={userAccount}
            notifications={notifications}
          />
        )}

        {dashboardView === 'settings' && (
          <SettingsView
            userAccount={userAccount}
            onSaveAccount={handleSaveAccount}
            onDeleteAccount={handleDeleteAccount}
            onSignOut={handleSignOut}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <AuthScreen
      mode="signin"
      onSwitchMode={(m) => setView(m)}
      onBackToLanding={() => setView('landing')}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AntirrathetoApp />
    </ErrorBoundary>
  );
}
