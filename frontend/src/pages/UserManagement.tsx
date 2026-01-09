import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Trash2, Clock, Wifi, CheckSquare, Square, Edit2, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

interface UserData {
    id: number;
    username: string;
    role: string;
    permissions: string;
    is_online: boolean;
    last_seen: string;
}

// Permission Definitions
const PERMISSIONS_GROUPS = [
    {
        name: 'Dashboard',
        key: 'dashboard',
        options: [
            { key: 'view_dashboard', label: 'Visualizar Dashboard' }
        ]
    },
    {
        name: 'Cargas & Fretes',
        key: 'freights',
        options: [
            { key: 'view_freights', label: 'Visualizar' },
            { key: 'create_freight', label: 'Criar' },
            { key: 'edit_freight', label: 'Editar' },
            { key: 'delete_freight', label: 'Excluir' }
        ]
    },
    {
        name: 'Motoristas',
        key: 'drivers',
        options: [
            { key: 'view_drivers', label: 'Visualizar' },
            { key: 'create_driver', label: 'Criar' },
            { key: 'edit_driver', label: 'Editar' },
            { key: 'delete_driver', label: 'Excluir' }
        ]
    },
    {
        name: 'Clientes',
        key: 'clients',
        options: [
            { key: 'view_clients', label: 'Visualizar' },
            { key: 'create_client', label: 'Criar' },
            { key: 'edit_client', label: 'Editar' },
            { key: 'delete_client', label: 'Excluir' }
        ]
    },
    {
        name: 'Cotações',
        key: 'quotations',
        options: [
            { key: 'view_quotations', label: 'Visualizar' },
            { key: 'create_quotation', label: 'Criar' },
            { key: 'edit_quotation', label: 'Editar' },
            { key: 'delete_quotation', label: 'Excluir' }
        ]
    },
    {
        name: 'Financeiro',
        key: 'finance',
        options: [
            { key: 'view_revenue', label: 'Visualizar Faturamento (Dashboard)' },
            { key: 'view_financial', label: 'Acessar Módulo Financeiro' },
            { key: 'view_billing', label: 'Acessar Cobranças (Boletos)' },
            { key: 'edit_financial', label: 'Gerenciar Lançamentos' }
        ]
    },
    {
        name: 'Configurações',
        key: 'settings',
        options: [
            { key: 'access_settings', label: 'Acessar Configurações (Geral)' },
            { key: 'manage_asaas', label: 'Gerenciar Integração Asaas' },
            { key: 'manage_templates', label: 'Gerenciar Modelos de Mensagem' }
        ]
    }
];

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'OPERATOR',
        permissions: [] as string[]
    });

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users/`);
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({
            username: '',
            password: '',
            role: 'OPERATOR',
            permissions: []
        });
        setMessage(null);
    };

    const handleEditClick = (user: UserData) => {
        setIsEditing(true);
        setEditingId(user.id);
        setFormData({
            username: user.username,
            password: '', // Password is required only for new users or explicit change
            role: user.role,
            permissions: user.permissions ? user.permissions.split(',') : []
        });
        setMessage(null);
    };

    const togglePermission = (key: string) => {
        setFormData(prev => {
            const perms = prev.permissions.includes(key)
                ? prev.permissions.filter(p => p !== key)
                : [...prev.permissions, key];
            return { ...prev, permissions: perms };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const payload = {
            ...formData,
            permissions: formData.permissions.join(','),
            // Don't send empty password on update
            ...(isEditing && !formData.password ? { password: undefined } : {})
        };

        try {
            if (isEditing && editingId) {
                await axios.put(`${API_URL}/users/${editingId}`, payload);
                setMessage({ text: 'Usuário atualizado com sucesso!', type: 'success' });
            } else {
                await axios.post(`${API_URL}/users/`, payload);
                setMessage({ text: 'Usuário criado com sucesso!', type: 'success' });
            }
            resetForm();
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setMessage({ text: err.response?.data?.detail || 'Erro ao salvar usuário', type: 'error' });
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Deseja excluir este usuário?')) return;
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Erro ao excluir');
        }
    };

    if (currentUser?.role !== 'ADMIN') {
        return <div className="p-8 text-center text-slate-500">Acesso negado.</div>;
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-100px)]">
            {/* Form Section */}
            <div className="w-[400px] bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 text-eagles-dark">
                        <User className="text-eagles-gold" size={24} />
                        <h2 className="text-xl font-bold">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    </div>
                    {isEditing && (
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600" title="Cancelar Edição">
                            <RotateCcw size={18} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome de Usuário</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-eagles-gold/50 outline-none disabled:opacity-50"
                            placeholder="Ex: joao.silva"
                            required
                            disabled={isEditing} // Often safer to lock username on edit
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                            placeholder={isEditing ? "******" : "Senha obrigatória"}
                            required={!isEditing}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Função</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                        >
                            <option value="OPERATOR">Operador</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Admin tem acesso total. Operador segue as permissões abaixo.</p>
                    </div>

                    {/* Permissions Grid */}
                    {formData.role === 'OPERATOR' && (
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Permissões de Acesso</label>
                            <div className="space-y-4">
                                {PERMISSIONS_GROUPS.map(group => (
                                    <div key={group.key}>
                                        <p className="text-xs font-bold text-eagles-gold mb-1">{group.name}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {group.options.map(option => (
                                                <div
                                                    key={option.key}
                                                    onClick={() => togglePermission(option.key)}
                                                    className={`cursor-pointer flex items-center space-x-2 text-xs p-1.5 rounded border transition ${formData.permissions.includes(option.key)
                                                        ? 'bg-eagles-gold/10 border-eagles-gold/30 text-eagles-dark'
                                                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {formData.permissions.includes(option.key) ? <CheckSquare size={14} className="text-eagles-gold" /> : <Square size={14} />}
                                                    <span>{option.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-eagles-dark text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 flex items-center justify-center"
                    >
                        {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-200 transition"
                        >
                            Cancelar
                        </button>
                    )}
                </form>
            </div>

            {/* Users List Section */}
            <div className="flex-1 bg-eagles-dark rounded-xl shadow-lg border border-slate-700 p-6 overflow-hidden flex flex-col">
                <div className="flex items-center space-x-2 text-white mb-6">
                    <Shield className="text-green-400" size={24} />
                    <h2 className="text-xl font-bold">Usuários Cadastrados</h2>
                    <span className="ml-auto text-xs text-slate-400">{users.length} USUÁRIOS</span>
                </div>

                <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {users.map(u => (
                        <div
                            key={u.id}
                            className={`bg-slate-800/50 border p-4 rounded-lg flex items-center justify-between transition group ${editingId === u.id ? 'border-eagles-gold bg-slate-800' : 'border-slate-700 hover:bg-slate-700/50'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.role === 'ADMIN' ? 'bg-eagles-gold/20 text-eagles-gold' : 'bg-slate-600'
                                        }`}>
                                        {u.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    {u.is_online ? (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                                    ) : (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-500 rounded-full border-2 border-slate-800"></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-bold">{u.username}</p>
                                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                                        <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${u.role === 'ADMIN' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {u.role}
                                        </span>
                                        {u.role === 'OPERATOR' && (
                                            <span className="text-slate-500">
                                                • {u.permissions ? u.permissions.split(',').length : 0} permissões
                                            </span>
                                        )}
                                        {u.is_online && <span className="text-green-400">• Online</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleEditClick(u)}
                                    className="p-2 text-slate-500 hover:text-eagles-gold hover:bg-eagles-gold/10 rounded-lg transition"
                                    title="Editar Permissões"
                                >
                                    <Edit2 size={18} />
                                </button>
                                {u.id !== currentUser?.id && (
                                    <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                                        title="Excluir Usuário"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
