import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Filter,
    Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Edit2, X, Settings2, BarChart3, PieChart as PieIcon,
    MoreHorizontal
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Financial = () => {
    const { hasPermission } = useAuth();
    const [summary, setSummary] = useState<any>({
        total_income: 0,
        total_expense: 0,
        balance: 0,
        total_payable: 0,
        total_receivable: 0,
        categories: []
    });
    const [history, setHistory] = useState([]); // Monthly history
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState<any[]>([]); // Dynamic Categories
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS'>('DASHBOARD');

    // Modals
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Transaction Form
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        type: 'EXPENSE',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING'
    });

    // Category Form
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('EXPENSE');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, historyRes, transactionsRes, categoriesRes] = await Promise.all([
                axios.get(`${API_URL}/financial/summary`),
                axios.get(`${API_URL}/financial/history`),
                axios.get(`${API_URL}/financial/transactions`),
                axios.get(`${API_URL}/financial/categories`)
            ]);
            setSummary(summaryRes.data);
            setHistory(historyRes.data);
            setTransactions(transactionsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error("Error fetching financial data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Transaction Logic ---
    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount.replace(',', '.')) // Handle comma
            };

            if (editingId) {
                await axios.patch(`${API_URL}/financial/transactions/${editingId}`, payload);
            } else {
                await axios.post(`${API_URL}/financial/transactions`, payload);
            }
            setIsTransactionModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Erro ao salvar lançamento");
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
        try {
            await axios.delete(`${API_URL}/financial/transactions/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            type: 'EXPENSE',
            category: '',
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            status: 'PENDING'
        });
    };

    const openEdit = (t: any) => {
        setEditingId(t.id);
        setFormData({
            type: t.type,
            category: t.category,
            description: t.description,
            amount: t.amount.toString(),
            date: t.date.split('T')[0],
            status: t.status
        });
        setIsTransactionModalOpen(true);
    };

    // --- Category Logic ---
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/financial/categories`, {
                name: newCategoryName,
                type: newCategoryType
            });
            setNewCategoryName('');
            // Refresh categories list
            const res = await axios.get(`${API_URL}/financial/categories`);
            setCategories(res.data);
        } catch (error) {
            alert('Erro ao criar categoria');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Excluir esta categoria?")) return;
        try {
            await axios.delete(`${API_URL}/financial/categories/${id}`);
            const res = await axios.get(`${API_URL}/financial/categories`);
            setCategories(res.data);
        } catch (error) {
            alert('Erro ao excluir categoria (pode ser do sistema)');
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

    const filteredTransactions = transactions.filter((t: any) => {
        if (filterType !== 'ALL' && t.type !== filterType) return false;
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
        return true;
    });

    if (!hasPermission('view_financial')) {
        return <div className="p-8 text-center text-slate-500">Acesso Negado.</div>;
    }

    // Default categories if API is empty (fallback)
    const availableCategories = categories.length > 0 ? categories : [
        { name: 'Fixa', type: 'EXPENSE' }, { name: 'Variável', type: 'EXPENSE' }, { name: 'Salário', type: 'EXPENSE' },
        { name: 'Frete', type: 'INCOME' }, { name: 'Outros', type: 'INCOME' }
    ];

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // KPI Filter Handler
    const handleCardClick = (type: string, status: string) => {
        setFilterType(type);
        setFilterStatus(status);
        setActiveTab('TRANSACTIONS');
    };

    // Translation Helper
    const t = (key: string) => {
        const map: any = {
            'INCOME': 'Receita',
            'EXPENSE': 'Despesa',
            'FIXED': 'Fixa',
            'VARIABLE': 'Variável',
            'SALARY': 'Salário',
            'FUEL': 'Combustível',
            'FREIGHT': 'Frete',
            'MAINTENANCE': 'Manutenção',
            'PAID': 'Pago',
            'PENDING': 'Pendente',
            'OVERDUE': 'Atrasado'
        };
        return map[key] || key;
    };

    return (
        <div className="space-y-8 pb-10 min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestão Financeira</h1>
                    <p className="text-slate-500 mt-1">Controle completo de fluxo de caixa e planejamento.</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasPermission('edit_financial') && (
                        <>
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition flex items-center gap-2"
                            >
                                <Settings2 size={18} />
                                Categorias
                            </button>
                            <button
                                onClick={() => { resetForm(); setIsTransactionModalOpen(true); }}
                                className="bg-eagles-gold text-eagles-dark font-bold px-6 py-2.5 rounded-xl hover:brightness-110 flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={20} />
                                Novo Lançamento
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Toggle View Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${activeTab === 'DASHBOARD' ? 'border-eagles-gold text-eagles-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Dashboard & Métricas
                </button>
                <button
                    onClick={() => setActiveTab('TRANSACTIONS')}
                    className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${activeTab === 'TRANSACTIONS' ? 'border-eagles-gold text-eagles-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Todos os Lançamentos
                </button>
            </div>

            {/* Content Active Tab */}
            {activeTab === 'DASHBOARD' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KPICard
                            title="Saldo Geral"
                            value={summary.balance}
                            icon={<DollarSign className="text-white" size={28} />}
                            color="bg-gradient-to-br from-blue-600 to-blue-500"
                            onClick={() => handleCardClick('ALL', 'ALL')}
                        />
                        <KPICard
                            title="A Receber (Pendente)"
                            value={summary.total_receivable}
                            icon={<TrendingUp className="text-white" size={28} />}
                            color="bg-gradient-to-br from-emerald-500 to-green-500"
                            onClick={() => handleCardClick('INCOME', 'PENDING')}
                        />
                        <KPICard
                            title="A Pagar (Pendente)"
                            value={summary.total_payable}
                            icon={<TrendingDown className="text-white" size={28} />}
                            color="bg-gradient-to-br from-rose-500 to-red-500"
                            onClick={() => handleCardClick('EXPENSE', 'PENDING')}
                        />
                        <KPICard
                            title="Despesas do Mês"
                            value={summary.total_expense}
                            icon={<Calendar className="text-white" size={28} />}
                            color="bg-gradient-to-br from-slate-700 to-slate-600"
                            onClick={() => handleCardClick('EXPENSE', 'ALL')}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Monthly Evolution (Bar Chart - User Request) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Fluxo de Caixa Mensal</h3>
                                    <p className="text-xs text-slate-400">Comparativo Receitas (Verde) vs Despesas (Vermelho)</p>
                                </div>
                                <BarChart3 className="text-slate-300" />
                            </div>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={history} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val / 1000}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <RechartsTooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Categories Pie */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-slate-800">Por Categoria</h3>
                                <PieIcon className="text-slate-300" />
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={summary.categories}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {summary.categories.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: any, name: any, props: any) => [formatCurrency(Number(value)), t(props.payload.name)]} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => t(value)}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Filters */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <MoreHorizontal size={20} className="text-slate-400" />
                            Lista de Lançamentos
                        </h3>
                        <div className="flex gap-3">
                            <div className="relative">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-eagles-gold/50 outline-none appearance-none"
                                >
                                    <option value="ALL">Todos Tipos</option>
                                    <option value="INCOME">Receitas</option>
                                    <option value="EXPENSE">Despesas</option>
                                </select>
                                <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            <div className="relative">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-eagles-gold/50 outline-none appearance-none"
                                >
                                    <option value="ALL">Todos Status</option>
                                    <option value="PAID">Pago / Recebido</option>
                                    <option value="PENDING">Pendente</option>
                                </select>
                                <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Data</th>
                                    <th className="px-6 py-4 text-left">Descrição</th>
                                    <th className="px-6 py-4 text-left">Categoria</th>
                                    <th className="px-6 py-4 text-left">Valor</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 font-mono">
                                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {tx.type === 'INCOME' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                                </div>
                                                <span className="font-semibold text-slate-700">{tx.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-500 border border-slate-200">
                                                {t(tx.category) || 'Geral'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-bold text-base ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {hasPermission('edit_financial') && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEdit(tx)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDeleteTransaction(tx.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="p-10 text-center text-slate-400">
                                Nenhum lançamento encontrado para os filtros selecionados.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Transaction Modal (Premium) --- */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                                <p className="text-sm text-slate-500">Preencha os dados abaixo.</p>
                            </div>
                            <button onClick={() => setIsTransactionModalOpen(false)} className="bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="p-8 space-y-6">
                            {/* Type Selector Toggle */}
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${formData.type === 'INCOME' ? 'bg-white text-green-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Receita (Entrada)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${formData.type === 'EXPENSE' ? 'bg-white text-red-500 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Despesa (Saída)
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-slate-400 font-bold">R$</span>
                                        <input
                                            type="number" step="0.01" required
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-slate-800 focus:ring-2 focus:ring-eagles-gold focus:bg-white transition outline-none"
                                            placeholder="0,00"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                                    <input
                                        type="date" required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-eagles-gold focus:bg-white transition outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-eagles-gold focus:bg-white transition outline-none"
                                        placeholder="Ex: Aluguel, Combustível..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-eagles-gold focus:bg-white transition outline-none appearance-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {availableCategories
                                            .filter(c => c.type === formData.type)
                                            .map((c, idx) => (
                                                <option key={idx} value={c.name}>{t(c.name)}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Status do Pagamento</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition ${formData.status === 'PAID' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                        <input type="radio" name="status" value="PAID" checked={formData.status === 'PAID'} onChange={() => setFormData({ ...formData, status: 'PAID' })} className="hidden" />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.status === 'PAID' ? 'border-green-500' : 'border-slate-300'}`}>
                                            {formData.status === 'PAID' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                                        </div>
                                        <span className={`font-bold ${formData.status === 'PAID' ? 'text-green-700' : 'text-slate-500'}`}>Pago / Recebido</span>
                                    </label>

                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition ${formData.status === 'PENDING' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                        <input type="radio" name="status" value="PENDING" checked={formData.status === 'PENDING'} onChange={() => setFormData({ ...formData, status: 'PENDING' })} className="hidden" />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.status === 'PENDING' ? 'border-yellow-400' : 'border-slate-300'}`}>
                                            {formData.status === 'PENDING' && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />}
                                        </div>
                                        <span className={`font-bold ${formData.status === 'PENDING' ? 'text-yellow-700' : 'text-slate-500'}`}>Pendente</span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-eagles-dark text-white font-bold py-4 rounded-xl shadow-xl hover:bg-slate-800 transition active:scale-95 text-lg">
                                Salvar Lançamento
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Category Management Modal --- */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800">Gerenciar Categorias</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
                        </div>
                        <div className="p-6 flex flex-col overflow-hidden">
                            {/* Add New */}
                            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6 shrink-0">
                                <select
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                                    value={newCategoryType} onChange={e => setNewCategoryType(e.target.value)}
                                >
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="INCOME">Receita</option>
                                </select>
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-eagles-gold/50"
                                    placeholder="Nome da nova categoria..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    required
                                />
                                <button type="submit" className="bg-eagles-gold text-eagles-dark font-bold px-4 rounded-lg hover:brightness-110">
                                    <Plus size={18} />
                                </button>
                            </form>

                            {/* List - Scrollable */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {availableCategories.length === 0 ? (
                                    <p className="text-slate-400 text-center text-sm mt-10">Nenhuma categoria cadastrada.</p>
                                ) : (
                                    availableCategories.map((cat: any, idx) => (
                                        <div key={cat.id || idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:bg-white hover:shadow-sm transition">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full ${cat.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="font-medium text-slate-700">{t(cat.name)}</span>
                                            </div>
                                            {!cat.is_system && (
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subcomponents
const KPICard = ({ title, value, icon, color, onClick }: any) => (
    <div
        onClick={onClick}
        className={`${color} rounded-2xl p-6 text-white shadow-lg shadow-blue-900/5 relative overflow-hidden group hover:scale-[1.02] transition duration-300 cursor-pointer`}
    >
        <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="absolute right-4 top-4 bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            {icon}
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-700"></div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    return status === 'PAID' ? (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
            Pago / Recebido
        </span>
    ) : (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm">
            Pendente
        </span>
    );
};

export default Financial;
