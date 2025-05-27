"use client"

import { Lock as LockIcon, Person as PersonIcon, School as SchoolIcon } from "@mui/icons-material"
import { Box, Button, InputAdornment, TextField, Typography } from "@mui/material"
import axios from "axios"
import type React from "react"
import { useState } from "react"
import "./Login.css"

interface LoginProps {
    onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await axios.post("http://localhost:8000/api/token/", {
                username,
                password,
            })
            localStorage.setItem("access_token", response.data.access)
            localStorage.setItem("refresh_token", response.data.refresh)
            setError("")
            onLogin()
        } catch (err) {
            setError("Usuario o contraseña incorrectos")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box className="login-container">
            <Box className="login-card">
                <Box className="login-header">
                    <Box className="login-logo">
                        <SchoolIcon className="login-logo-icon" />
                    </Box>
                    <Typography className="login-title">Bienvenido</Typography>
                    <Typography className="login-subtitle">Sistema de Mapas y Seguridad - Universidad de Talca</Typography>
                </Box>

                <form onSubmit={handleLogin} className="login-form">
                    <Box className={`login-field ${focusedField === "username" ? "focused" : ""}`}>
                        <TextField
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setFocusedField("username")}
                            onBlur={() => setFocusedField(null)}
                            fullWidth
                            variant="outlined"
                            required
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
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField(null)}
                            fullWidth
                            variant="outlined"
                            required
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
                                <Box className="login-loading-spinner" />
                                Iniciando sesión...
                            </Box>
                        ) : (
                            "Iniciar Sesión"
                        )}
                    </Button>
                </form>

                {error && <Box className="login-error">{error}</Box>}

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
    )
}

export default Login
