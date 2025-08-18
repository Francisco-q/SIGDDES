import React, { useState } from 'react';
import { useAuth } from '../hooks';
import { LoginFormPresentation } from './LoginFormPresentation';

interface LoginContainerProps {
  onLogin: () => void;
}

export const LoginContainer: React.FC<LoginContainerProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      // Error ya está manejado por el hook useAuth
    }
  };

  const handleFocusField = (field: string) => {
    setFocusedField(field);
  };

  const handleBlurField = () => {
    setFocusedField(null);
  };

  return (
    <LoginFormPresentation
      username={username}
      password={password}
      error={error}
      loading={loading}
      focusedField={focusedField}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onFocusField={handleFocusField}
      onBlurField={handleBlurField}
      onSubmit={handleSubmit}
    />
  );
};
