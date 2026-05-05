import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InspectionDetail } from '../components/inspections';

const InspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id || isNaN(Number(id))) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Invalid inspection ID</p>
        </div>
      </div>
    );
  }

  return (
    <InspectionDetail
      inspectionId={Number(id)}
      onBack={() => navigate('/inspections')}
    />
  );
};

export default InspectionDetailPage;