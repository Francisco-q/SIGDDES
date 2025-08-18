import React from 'react';
import { LoginContainer } from '../../features/auth';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return <LoginContainer onLogin={onLogin} />;
};
