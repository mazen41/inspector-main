import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useDispatch } from 'react-redux';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { Layout, ErrorBoundary } from './components/common';
import { ProtectedRoute } from './components/auth';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { useGetLanguagesQuery } from './store/api/languageApi';
import { setAvailableLanguages } from './store/slices/localizationSlice';
import {
  LoginPage,
  DashboardPage,
  InspectionsPage,
  InspectionDetailPage,
  InspectionFormPage,
  ManualExaminationsPage,
  ManualExaminationCreatePage,
  ManualExaminationDetailPage,
  PaymentsPage,
  ProfilePage,
} from './pages';
import { ROUTES } from './utils/constants';

// Language Initialization Component
const LanguageInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { data: languages, isLoading, error } = useGetLanguagesQuery();

  useEffect(() => {
    if (languages && languages.length > 0) {
      dispatch(setAvailableLanguages(languages));
    }
  }, [languages, dispatch]);

  // Show loading state while languages are being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state if language loading fails
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load languages</h2>
          <p className="text-gray-600">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const canManualExamination = user?.inspector?.permissions?.can_manual_examination !== false;

  const manualRoute = (page: React.ReactNode) => (
    <ProtectedRoute>
      {canManualExamination ? (
        <Layout>{page}</Layout>
      ) : (
        <Navigate to={ROUTES.DASHBOARD} replace />
      )}
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route 
        path={ROUTES.LOGIN} 
        element={
          isAuthenticated ? (
            <Navigate to={ROUTES.DASHBOARD} replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.INSPECTIONS}
        element={
          <ProtectedRoute>
            <Layout>
              <InspectionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.INSPECTION_DETAIL}
        element={
          <ProtectedRoute>
            <Layout>
              <InspectionDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.INSPECTION_EDIT}
        element={
          <ProtectedRoute>
            <Layout>
              <InspectionFormPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MANUAL_EXAMINATIONS}
        element={manualRoute(<ManualExaminationsPage />)}
      />

      <Route
        path={ROUTES.MANUAL_EXAMINATION_CREATE}
        element={manualRoute(<ManualExaminationCreatePage />)}
      />

      <Route
        path={ROUTES.MANUAL_EXAMINATION_DETAIL}
        element={manualRoute(<ManualExaminationDetailPage />)}
      />
      
      <Route
        path={ROUTES.PAYMENTS}
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      
      {/* Catch all route - redirect to dashboard if authenticated, login if not */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} 
            replace 
          />
        } 
      />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <LanguageInitializer>
          <LocalizationProvider>
            <Router>
              <div className="App">
                <AppRoutes />
              </div>
            </Router>
          </LocalizationProvider>
        </LanguageInitializer>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
