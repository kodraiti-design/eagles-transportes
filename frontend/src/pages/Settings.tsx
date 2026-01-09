import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, MessageSquare, Info, CreditCard, Lock, Eye, EyeOff, Database, RotateCcw, AlertTriangle, CloudDownload } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface MessageTemplate {
    id: number;
    name: string;
    slug: string;
    content: string;
    description: string;
    is_active: boolean;
}

const Settings = () => {
    const { hasPermission } = useAuth();
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${API_URL}/templates/`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    // Asaas Config State
    const [asaasKey, setAsaasKey] = useState('');
    const [asaasEnv, setAsaasEnv] = useState('SANDBOX');
    const [showKey, setShowKey] = useState(false);
    const [savingAsaas, setSavingAsaas] = useState(false);

    const fetchAsaasConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/billing/config`);
            if (res.ok) {
                const data = await res.json();
                setAsaasKey(data.api_key || '');
                setAsaasEnv(data.environment || 'SANDBOX');
            }
        } catch (error) {
            console.error('Error fetching asaas config', error);
        }
    };

    // Backup State
    const [backups, setBackups] = useState<any[]>([]);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const fetchBackups = async () => {
        try {
            const res = await fetch(`${API_URL}/backup/list`);
            if (res.ok) {
                const data = await res.json();
                setBackups(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        try {
            const res = await fetch(`${API_URL}/backup/create`, { method: 'POST' });
            if (res.ok) {
                alert("Backup criado com sucesso!");
                fetchBackups();
            } else {
                alert("Erro ao criar backup");
            }
        } catch (error) {
            alert("Erro ao conectar ao servidor");
        } finally {
            setIsCreatingBackup(false);
        }
    };

    const handleRestoreBackup = async (id: string) => {
        if (!confirm("⚠️ ATENÇÃO: Restaurar um backup irá SUBSTITUIR todos os dados atuais (fretes, clientes, etc) pelos dados do backup.\n\nVocê tem certeza?")) return;

        setIsRestoring(true);
        try {
            const res = await fetch(`${API_URL}/backup/restore/${id}`, { method: 'POST' });
            if (res.ok) {
                alert("Backup restaurado com sucesso! O sistema pode precisar ser reiniciado.");
                window.location.reload();
            } else {
                const data = await res.json();
                alert("Erro: " + data.detail);
            }
        } catch (error) {
            alert("Erro crítico ao restaurar. Verifique o servidor.");
        } finally {
            setIsRestoring(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
        fetchAsaasConfig();
        fetchBackups();
    }, []);

    const handleSaveAsaas = async () => {
        setSavingAsaas(true);
        try {
            const res = await fetch(`${API_URL}/billing/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: asaasKey, environment: asaasEnv })
            });
            if (res.ok) {
                alert('Configuração Asaas salva com sucesso!');
                fetchAsaasConfig(); // Refresh to get masked key if needed
            } else {
                alert('Erro ao salvar configuração');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar');
        } finally {
            setSavingAsaas(false);
        }
    };

    // System Update State
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSystemUpdate = async () => {
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/system/update`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert(`Sucesso!\n\n${data.message}\n\nDetalhes:\n${data.log}`);
                window.location.reload();
            } else {
                alert(`Atenção:\n\n${data.message}\n\nLog:\n${data.log || ''}\n\n${data.detail || ''}`);
            }
        } catch (error) {
            alert("Erro ao conectar ao servidor de atualização.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSave = async (template: MessageTemplate) => {
        setSaving(template.id);
        try {
            const response = await fetch(`${API_URL}/templates/${template.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: template.content,
                    is_active: template.is_active
                }),
            });

            if (response.ok) {
                // Show success feedback if needed
            } else {
                alert('Erro ao salvar modelo');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Erro ao salvar modelo');
        } finally {
            setSaving(null);
        }
    };

    const updateContent = (id: number, newContent: string) => {
        setTemplates(templates.map(t =>
            t.id === id ? { ...t, content: newContent } : t
        ));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eagles-gold"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
                    <p className="text-slate-500">Gerencie modelos de mensagens e preferências do sistema</p>
                </div>
            </div>

            {/* Asaas Integration Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                        <Database size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Backup e Restauração</h2>
                        <p className="text-sm text-slate-500">Salve e recupere os dados do sistema com segurança.</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm text-slate-600 max-w-lg">
                            <span className="font-bold flex items-center gap-1 mb-1 text-slate-800"><AlertTriangle size={14} className="text-amber-500" /> Importante:</span>
                            O backup salva todos os dados (Fretes, Clientes, Motoristas) e arquivos (Fotos).
                            Não salva o código-fonte (que já é seguro).
                        </div>
                        <button
                            onClick={handleCreateBackup}
                            disabled={isCreatingBackup}
                            className={`px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition flex items-center gap-2 ${isCreatingBackup ? 'opacity-70' : ''}`}
                        >
                            {isCreatingBackup ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            Criar Backup Agora
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-medium text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Data do Backup</th>
                                    <th className="px-4 py-3 text-left">Identificador</th>
                                    <th className="px-4 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {backups.length === 0 ? (
                                    <tr><td colSpan={3} className="p-6 text-center text-slate-400">Nenhum backup encontrado.</td></tr>
                                ) : (
                                    backups.map(b => (
                                        <tr key={b.id} className="hover:bg-white transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-700">{b.date}</td>
                                            <td className="px-4 py-3 font-mono text-slate-500 text-xs">{b.id}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleRestoreBackup(b.id)}
                                                    disabled={isRestoring}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 justify-end ml-auto hover:bg-blue-50 px-2 py-1 rounded transition"
                                                >
                                                    <RotateCcw size={14} /> Restaurar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* System Update Section */}
            {hasPermission('access_settings') && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <CloudDownload size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Atualização do Sistema</h2>
                            <p className="text-sm text-slate-500">Verifique se há novas versões disponíveis.</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <p className="text-sm text-slate-600 max-w-lg">
                            Esta função baixará automaticamente as melhorias mais recentes (via Git) e aplicará ao sistema.
                        </p>
                        <button
                            onClick={handleSystemUpdate}
                            disabled={isUpdating}
                            className={`px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition flex items-center gap-2 ${isUpdating ? 'opacity-70' : ''}`}
                        >
                            {isUpdating ? <RefreshCw className="animate-spin" size={16} /> : <CloudDownload size={16} />}
                            {isUpdating ? 'Atualizando...' : 'Buscar Atualizações'}
                        </button>
                    </div>
                </div>
            )}

            {/* Asaas Integration Section */}
            {hasPermission('manage_asaas') && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Integração Asaas (Boletos)</h2>
                            <p className="text-sm text-slate-500">Configure sua chave de API para emissão de cobranças</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Ambiente</label>
                                <select
                                    value={asaasEnv}
                                    onChange={(e) => setAsaasEnv(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/20 outline-none bg-white"
                                >
                                    <option value="SANDBOX">Sandbox (Testes)</option>
                                    <option value="PRODUCTION">Produção (Valendo)</option>
                                </select>
                                <p className="text-xs text-slate-500">
                                    {asaasEnv === 'SANDBOX' ? 'Ambiente seguro para testes. O dinheiro é fictício.' : '⚠️ Cuidado: Boletos emitidos aqui são reais.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">API Key</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={asaasKey}
                                        onChange={(e) => setAsaasKey(e.target.value)}
                                        placeholder="$aact_..."
                                        className="w-full pl-10 pr-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/20 outline-none"
                                    />
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleSaveAsaas}
                                disabled={savingAsaas}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium transition ${savingAsaas
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                                    }`}
                            >
                                {savingAsaas ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                <span>Salvar Configuração</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Message Templates Section */}
            {hasPermission('manage_templates') && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Modelos de Mensagem WhatsApp</h2>
                            <p className="text-sm text-slate-500">Personalize os textos enviados para motoristas e clientes</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {templates.map(template => (
                            <div key={template.id} className="p-6 hover:bg-slate-50/50 transition duration-150">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 flex items-center">
                                            {template.name}
                                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                                                {template.slug}
                                            </span>
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSave(template)}
                                        disabled={saving === template.id}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition ${saving === template.id
                                            ? 'bg-slate-400 cursor-not-allowed'
                                            : 'bg-eagles-gold hover:bg-yellow-600 shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        {saving === template.id ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        <span>{saving === template.id ? 'Salvando...' : 'Salvar Alterações'}</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={template.content}
                                        onChange={(e) => updateContent(template.id, e.target.value)}
                                        rows={6}
                                        className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/20 focus:border-eagles-gold outline-none font-mono text-sm leading-relaxed text-slate-700 bg-white"
                                    />
                                    <div className="absolute top-2 right-2 group">
                                        <Info size={16} className="text-slate-300 hover:text-eagles-gold cursor-help" />
                                        <div className="hidden group-hover:block absolute right-0 top-6 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl z-10">
                                            Use variáveis entre chaves.<br />
                                            Ex: {"{motorista}"}, {"{placa}"}, {"{origem}"}.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {templates.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                Nenhum modelo encontrado.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
