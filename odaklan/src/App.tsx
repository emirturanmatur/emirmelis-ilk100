import { UserProvider, useUser } from './context/UserContext';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AssistantChat from './components/AssistantChat';

function Shell() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-ink-700 border-t-teal-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <Onboarding />;

  return (
    <>
      <Dashboard />
      <AssistantChat />
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Shell />
    </UserProvider>
  );
}
