import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, LayoutDashboard, Trophy, User, Shield } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();
  const currentPath = window.location.pathname;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Competições', href: '/competitions', icon: Trophy },
    { name: 'Perfil', href: '/profile', icon: User },
  ];

  if (profile?.is_admin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <a href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  FitChallenge
                </span>
              </a>

              <div className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.href;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.goal_type === 'lose_weight'
                    ? 'Emagrecimento'
                    : profile?.goal_type === 'gain_muscle'
                    ? 'Ganho de Massa'
                    : 'Manutenção'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.name}</span>
              </a>
            );
          })}
        </div>
      </div>

      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}
