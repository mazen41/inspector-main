import React, { useState } from 'react';
import { 
  ProfileForm, 
  AvatarUpload, 
  PasswordChangeForm, 
  BusinessSettingsForm 
} from '../components/profile';
import { useTranslation } from '@/hooks';

type TabType = 'profile' | 'avatar' | 'password' | 'business';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const { t } = useTranslation();
  const tabs = [
    { id: 'profile' as TabType, label: t('profile.sections.personalInfo'), icon: '👤' },
    { id: 'avatar' as TabType, label: t('profile.sections.profilePicture'), icon: '📷' },
    { id: 'business' as TabType, label: t('profile.sections.businessSettings'), icon: '⚙️' },
    { id: 'password' as TabType, label: t('profile.sections.changePassword'), icon: '🔒' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileForm />;
      case 'avatar':
        return <AvatarUpload />;
      case 'business':
        return <BusinessSettingsForm />;
      case 'password':
        return <PasswordChangeForm />;
      default:
        return <ProfileForm />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3 text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;