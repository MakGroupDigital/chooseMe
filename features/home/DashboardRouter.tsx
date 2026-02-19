import React from 'react';
import { UserType } from '../../types';
import HomeChoosePage from './HomeChoosePage';
import AthleteDashboard from './dashboards/AthleteDashboard';
import RecruiterDashboard from './dashboards/RecruiterDashboard';
import ClubDashboard from './dashboards/ClubDashboard';
import PressDashboard from './dashboards/PressDashboard';

interface Props {
  userType: UserType;
}

const DashboardRouter: React.FC<Props> = ({ userType }) => {
  // Tous les utilisateurs voient le feed vidéo par défaut
  return <HomeChoosePage userType={userType} />;
};

export default DashboardRouter;
