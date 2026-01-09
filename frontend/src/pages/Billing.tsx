import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import {
    CheckCircle, Clock, Printer, AlertCircle, X, RefreshCw
} from 'lucide-react';

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PAID':
        case 'RECEIVED':
        case 'CONFIRMED':
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 uppercase">Pago</span>;
        case 'OVERDUE':
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">Atrasado</span>;
        case 'ISSUED':
        case 'PENDING':
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">Aguardando</span>;
        default:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 uppercase">{status}</span>;
    }
};

const Billing = () => {
    const { hasPermission } = useAuth();
    const [pendingFreights, setPendingFreights] = useState([]);
    const [issuedFreights, setIssuedFreights] = useState([]);
    const [tab, setTab] = useState<'PENDING' | 'ISSUED'>('PENDING');
    const [loading, setLoading] = useState(true);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

    // Issue Form
    const [selectedFreight, setSelectedFreight] = useState<any>(null);
    const [boletoValue, setBoletoValue] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await axios.post(`${API_URL}/billing/sync`);
            alert(res.data.message);
            fetchPending();
        } catch (error) {
            console.error(error);
            alert("Erro ao sincronizar status.");
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const [resPending, resIssued] = await Promise.all([
                axios.get(`${API_URL}/billing/pending`),
                axios.get(`${API_URL}/billing/issued`)
            ]);
            setPendingFreights(resPending.data);
            setIssuedFreights(resIssued.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const openIssueModal = (freight: any) => {
        setSelectedFreight(freight);
        setBoletoValue(freight.valor_cliente.toFixed(2));

        // Default Due Date: Today + 5 days
        const date = new Date();
        date.setDate(date.getDate() + 5);
        setDueDate(date.toISOString().split('T')[0]);

        setDescription(`Frete Eagles - Origem: ${freight.origin} / Destino: ${freight.destination}`);
        setIsIssueModalOpen(true);
    };

    const handleIssueBoleto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFreight) return;
        setIsSubmitting(true);
        try {
            const payload = {
                value: parseFloat(boletoValue),
                due_date: dueDate,
                description: description
            };
            const res = await axios.post(`${API_URL}/billing/emit/${selectedFreight.id}`, payload);
            if (res.data.success) {
                alert("Boleto emitido com sucesso!");
                window.open(res.data.boleto_url, "_blank");
                setIsIssueModalOpen(false);
                fetchPending(); // Refresh list
            }
        } catch (error: any) {
            alert("Erro ao emitir boleto: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasPermission('view_financial')) {
        return <div className="p-8 text-center text-slate-500">Acesso Negado (Requer Permissão Financeira)</div>;
    }

    return (
        <div className="space-y-8 pb-10 min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cobranças & Boletos</h1>
                    <p className="text-slate-500 mt-1">Gerencie a emissão de boletos para fretes finalizados.</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setTab('PENDING')}
                    className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 transition-colors relative ${tab === 'PENDING' ? 'text-eagles-gold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Clock size={16} />
                    Pendente de Faturamento
                    {tab === 'PENDING' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-eagles-gold rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setTab('ISSUED')}
                    className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 transition-colors relative ${tab === 'ISSUED' ? 'text-eagles-gold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <CheckCircle size={16} />
                    Histórico de Emissões
                    {tab === 'ISSUED' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-eagles-gold rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* List Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        {tab === 'PENDING' ? (
                            <><Clock size={20} className="text-orange-500" /> Pendente de Faturamento</>
                        ) : (
                            <><CheckCircle size={20} className="text-green-500" /> Boletos Emitidos</>
                        )}
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`text-sm px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition ${isSyncing ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar Status'}
                        </button>
                        <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline">Atualizar</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Entrega</th>
                                <th className="px-6 py-4 text-left">Cliente</th>
                                <th className="px-6 py-4 text-left">Rota</th>
                                <th className="px-6 py-4 text-left">Valor (R$)</th>
                                {tab === 'ISSUED' && <th className="px-6 py-4 text-left">Status</th>}
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
                            ) : (tab === 'PENDING' ? pendingFreights : issuedFreights).length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                            ) : (
                                (tab === 'PENDING' ? pendingFreights : issuedFreights).map((f: any) => (
                                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 font-mono">
                                            {new Date(f.delivery_date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{f.client_name}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {f.origin} <span className="text-slate-400">➔</span> {f.destination}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">
                                            R$ {f.valor_cliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        {tab === 'ISSUED' && (
                                            <td className="px-6 py-4">
                                                {getStatusBadge(f.billing_status)}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            {tab === 'PENDING' ? (
                                                <button
                                                    onClick={() => openIssueModal(f)}
                                                    className="bg-eagles-dark text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition flex items-center gap-2 ml-auto"
                                                >
                                                    <Printer size={16} /> Emitir Boleto
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => window.open(f.boleto_url, "_blank")}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 ml-auto"
                                                    title="Visualizar segunda via"
                                                >
                                                    <Printer size={16} /> Ver Boleto
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hint Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
                <AlertCircle className="shrink-0" size={20} />
                <p>
                    <strong>Nota:</strong> Ao emitir o boleto, ele será processado via Asaas.
                    O cliente receberá notificação se o e-mail estiver cadastrado.
                    O link do PDF abrirá automaticamente após a emissão.
                </p>
            </div>

            {/* --- Issue Modal --- */}
            {isIssueModalOpen && selectedFreight && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800">Emitir Boleto de Cobrança</h3>
                            <button onClick={() => setIsIssueModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
                        </div>

                        <form onSubmit={handleIssueBoleto} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
                                <div className="p-3 bg-slate-100 rounded-lg text-slate-600 font-medium">
                                    {selectedFreight.client_name}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Boleto (R$)</label>
                                    <input
                                        type="number" step="0.01" required
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-eagles-gold"
                                        value={boletoValue}
                                        onChange={e => setBoletoValue(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Vencimento</label>
                                    <input
                                        type="date" required
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-eagles-gold"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-eagles-gold"
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Emitindo...' : <><CheckCircle size={20} /> Confirmar Emissão</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
