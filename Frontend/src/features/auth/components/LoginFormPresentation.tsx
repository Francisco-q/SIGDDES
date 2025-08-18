import React from 'react';
import { Lock as LockIcon, Person as PersonIcon, School as SchoolIcon } from "@mui/icons-material";
import { Box, Button, InputAdornment, TextField, Typography } from "@mui/material";
import { LoadingSpinner } from '../../../shared/components/ui';
import './Login.css';

interface LoginFormPresentationProps {
  username: string;
  password: string;
  error: string | null;
  loading: boolean;
  focusedField: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFocusField: (field: string) => void;
  onBlurField: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginFormPresentation: React.FC<LoginFormPresentationProps> = ({
  username,
  password,
  error,
  loading,
  focusedField,
  onUsernameChange,
  onPasswordChange,
  onFocusField,
  onBlurField,
  onSubmit
}) => {
  return (
    <Box className="login-container">
      <Box className="login-card">
        <Box className="login-header">
          <Box className="login-logo">
            <SchoolIcon className="login-logo-icon" />
          </Box>
          <Typography className="login-title">Bienvenido</Typography>
          <Typography className="login-subtitle">
            Sistema de Mapas y Seguridad - Universidad de Talca
          </Typography>
        </Box>

        <form onSubmit={onSubmit} className="login-form">
          <Box className={`login-field ${focusedField === "username" ? "focused" : ""}`}>
            <TextField
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              onFocus={() => onFocusField("username")}
              onBlur={onBlurField}
              fullWidth
              variant="outlined"
              required
              placeholder="Usuario"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon className="login-field-icon" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className={`login-field ${focusedField === "password" ? "focused" : ""}`}>
            <TextField
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onFocus={() => onFocusField("password")}
              onBlur={onBlurField}
              fullWidth
              variant="outlined"
              required
              placeholder="Contraseña"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon className="login-field-icon" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !username || !password}
            className="login-button"
          >
            {loading ? (
              <Box className="login-loading">
                <LoadingSpinner size="sm" />
                <span style={{ marginLeft: '8px' }}>Iniciando sesión...</span>
              </Box>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        {error && (
          <Box className="login-error">
            {error}
          </Box>
        )}

        <Box className="login-footer">
          <Typography className="login-footer-text">
            ¿Problemas para acceder?{" "}
            <a href="#" className="login-footer-link">
              Contacta al administrador
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
