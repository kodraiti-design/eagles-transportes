import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use FormData as OAuth2PasswordRequestForm expects form data, not JSON usually, 
            // but our schema LoginData expects JSON. 
            // backend/routers/auth.py uses `form_data: schemas.LoginData` -> implies JSON body.
            // If it used `Depends(OAuth2PasswordRequestForm)`, it would need form-data.
            // The router code: `def login_for_access_token(form_data: schemas.LoginData...` 
            // So we send JSON.

            const response = await axios.post(`${API_URL}/login`, {
                username,
                password
            });

            const { access_token, user } = response.data;
            login(access_token, user);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('Usuário ou senha incorretos.');
            } else {
                setError('Erro ao conectar com o servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-eagles-dark flex items-center justify-center p-4">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-eagles-gold to-yellow-200 bg-clip-text text-transparent">
                        Bem-vindo
                    </h1>
                    <p className="text-slate-400 mt-2">Faça login para acessar o sistema.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Usuário</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-eagles-gold transition" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-eagles-gold/50 focus:border-eagles-gold transition"
                                placeholder="Digite seu usuário"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-eagles-gold transition" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-eagles-gold/50 focus:border-eagles-gold transition"
                                placeholder="******"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span>Entrando...</span>
                        ) : (
                            <>
                                <span>ENTRAR</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-600 mt-4">
                        Acesso restrito a colaboradores autorizados Eagles Transportes
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
