import React from 'react';
import HomeChoosePage from './HomeChoosePage';
import { UserType } from '../../types';

interface Props {
  userType: UserType;
}

const DashboardRouter: React.FC<Props> = ({ userType }) => {
  // Tous les utilisateurs voient le feed vidéo par défaut
  return <HomeChoosePage userType={userType} />;
};

export default DashboardRouter;
