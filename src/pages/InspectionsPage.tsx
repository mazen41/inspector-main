import React, { useState } from 'react';
import { InspectionList, InspectionDetail } from '../components/inspections';
import { useTranslation } from '../hooks/useTranslation';
const InspectionsPage: React.FC = () => {
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const { t } = useTranslation();
  if (selectedInspectionId) {
    return (
      <InspectionDetail
        inspectionId={selectedInspectionId}
        onBack={() => setSelectedInspectionId(null)}
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-full overflow-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('inspections.list.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
         {t('navigation.inspectionsDescription')}
        </p>
      </div>
      
      <InspectionList onInspectionSelect={setSelectedInspectionId} />
    </div>
  );
};

export default InspectionsPage;