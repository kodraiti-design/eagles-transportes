import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Truck, PackageCheck, AlertCircle, TrendingUp, MapPin, PieChart as PieIcon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';
import Modal from '../components/Modal';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Drilldown State
    const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
    const [drillDownData, setDrillDownData] = useState<any[]>([]);
    const [drillDownTitle, setDrillDownTitle] = useState("");
    const [drillDownLoading, setDrillDownLoading] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/dashboard/stats`);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleChartClick = async (data: any, type: 'state' | 'vehicle' | 'kpi') => {
        if (!data) return;
        const value = data.name || data.activeLabel;
        if (!value) return;

        setDrillDownTitle(`Detalhes: ${value}`);
        setIsDrillDownOpen(true);
        setDrillDownLoading(true);
        setDrillDownData([]);

        try {
            const response = await axios.get(`${API_URL}/dashboard/drilldown`, {
                params: { filter_type: type, filter_value: value }
            });
            setDrillDownData(response.data);
        } catch (error) {
            console.error("Error fetching drilldown", error);
        } finally {
            setDrillDownLoading(false);
        }
    };

    const COLORS = ['#EAB308', '#3B82F6', '#22C55E', '#EF4444', '#A855F7', '#64748B'];

    if (loading) {
        return <div className="flex h-96 items-center justify-center text-slate-400">Carregando painel...</div>;
    }

    if (!stats) {
        return <div className="text-center py-10 text-red-500">Erro ao carregar dados. Verifique a conexão.</div>;
    }

    // Permission check for Revenue
    const canViewRevenue = hasPermission('view_revenue');

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Revenue (Billing) - Only for permitted users */}
                {canViewRevenue && (
                    <StatCard
                        title="Faturamento (Mês)"
                        value={formatCurrency(stats.kpis.monthly_revenue)}
                        icon={<span className="text-green-600 font-bold text-lg">R$</span>}
                        trend="+ ---"
                    />
                )}

                {/* Driver Cost or Freight Value */}
                <StatCard
                    title={canViewRevenue ? "Custo Motoristas" : "Valor Fretes (Mês)"}
                    value={formatCurrency(stats.kpis.monthly_driver_cost)}
                    icon={<span className="text-orange-500 font-bold text-lg">R$</span>}
                    // For Admin/Permitted, it's a cost (orange border). For others, it's just value (clean).
                    className={canViewRevenue ? 'border-orange-100 bg-orange-50/30' : ''}
                />

                <StatCard
                    title="Fretes Ativos"
                    value={stats.kpis.active_freights}
                    icon={<Truck className="text-blue-500" />}
                    onClick={() => handleChartClick({ name: 'active' }, 'kpi')}
                />
                <StatCard
                    title="Entregas (Hoje)"
                    value={stats.kpis.deliveries_today}
                    icon={<PackageCheck className="text-eagles-gold" />}
                    onClick={() => handleChartClick({ name: 'today' }, 'kpi')}
                />
                <StatCard
                    title="Atrasos"
                    value={stats.kpis.delays}
                    icon={<AlertCircle className="text-red-500" />}
                    alert={stats.kpis.delays > 0}
                    onClick={() => handleChartClick({ name: 'delayed' }, 'kpi')}
                />
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={20} className="text-eagles-gold" />
                            Origem dos Fretes (Estados)
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stats.charts.by_state}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    name="Fretes"
                                    fill="#EAB308"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                    className="cursor-pointer"
                                    onClick={(data) => handleChartClick(data, 'state')}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2">Clique nas barras para ver detalhes.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <PieIcon size={20} className="text-blue-500" />
                            Veículos Solicitados
                        </h3>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.charts.by_vehicle}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => handleChartClick(data, 'vehicle')}
                                    className="cursor-pointer outline-none"
                                >
                                    {stats.charts.by_vehicle.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition cursor-pointer" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2">Clique no gráfico para ver detalhes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity / Freights */}
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Fretes em Andamento (Recentes)</h3>
                        <button onClick={() => navigate('/freights')} className="text-eagles-accent text-sm font-medium hover:underline">Ver todos</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-sm border-b border-slate-100">
                                    <th className="pb-3">Destino</th>
                                    <th className="pb-3">Motorista</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600 text-sm">
                                {stats.recent_freights.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Nenhum frete recente.</td></tr>
                                ) : (
                                    stats.recent_freights.map((freight: any) => (
                                        <tr key={freight.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                            <td className="py-4 font-medium text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{freight.destination}</span>
                                                    <span className="text-xs text-slate-400 font-normal">{format(new Date(freight.pickup_date), 'dd/MM HH:mm')}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                {freight.driver ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                            {freight.driver.name.substring(0, 1)}
                                                        </div>
                                                        {freight.driver.name.split(' ')[0]}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">--</span>
                                                )}
                                            </td>
                                            <td className="py-4"><StatusBadge status={freight.status} /></td>
                                            <td className="py-4 text-right font-medium">{formatCurrency(freight.valor_motorista)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Shortcuts/Quick Actions */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Acesso Rápido</h3>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/quotations')}
                            className="w-full bg-slate-50 hover:bg-slate-100 p-4 rounded-xl flex items-center space-x-4 transition border border-slate-200"
                        >
                            <div className="bg-green-100 p-2 rounded-lg text-green-600 font-bold text-sm flex items-center justify-center w-10 h-10">R$</div>
                            <div className="text-left">
                                <p className="font-semibold text-slate-700">Nova Cotação</p>
                                <p className="text-xs text-slate-400">Calcular frete rápido</p>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/freights')}
                            className="w-full bg-slate-50 hover:bg-slate-100 p-4 rounded-xl flex items-center space-x-4 transition border border-slate-200"
                        >
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><PackageCheck size={20} /></div>
                            <div className="text-left">
                                <p className="font-semibold text-slate-700">Novo Frete</p>
                                <p className="text-xs text-slate-400">Agendar carga</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* Drilldown Modal */}
            <Modal isOpen={isDrillDownOpen} onClose={() => setIsDrillDownOpen(false)} title={drillDownTitle}>
                <div className="max-h-[60vh] overflow-y-auto">
                    {drillDownLoading ? (
                        <div className="flex justify-center py-10 text-slate-400">Carregando detalhes...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr className="text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                                    <th className="pb-2 pt-2 pl-2">Origem/Destino</th>
                                    <th className="pb-2 pt-2">Data</th>
                                    <th className="pb-2 pt-2">Motorista</th>
                                    <th className="pb-2 pt-2 text-right pr-2">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600 text-sm divide-y divide-slate-100">
                                {drillDownData.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">Nenhum frete encontrado neste filtro.</td></tr>
                                ) : (
                                    drillDownData.map((freight: any) => (
                                        <tr key={freight.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate('/freights')}>
                                            <td className="py-3 pl-2">
                                                <div className="font-medium text-slate-800">{freight.origin}</div>
                                                <div className="text-xs text-slate-400">➜ {freight.destination}</div>
                                            </td>
                                            <td className="py-3 text-xs">
                                                {format(new Date(freight.pickup_date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="py-3">
                                                {freight.driver ? (
                                                    <span className="text-slate-700">{freight.driver.name.split(' ')[0]}</span>
                                                ) : <span className="text-slate-400 italic">--</span>}
                                            </td>
                                            <td className="py-3 text-right pr-2 font-medium text-slate-700">
                                                {formatCurrency(freight.valor_motorista)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setIsDrillDownOpen(false)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition">
                        Fechar
                    </button>
                </div>
            </Modal>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, alert, onClick, className }: any) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'} ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''} ${className || ''}`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-500 text-sm mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${alert ? 'bg-red-100' : 'bg-slate-50'}`}>
                {icon}
            </div>
        </div>
        {trend && <p className="text-green-500 text-xs font-bold mt-2">{trend} <span className="text-slate-400 font-normal">vs mês passado</span></p>}
    </div>
);

const StatusBadge = ({ status }: any) => {
    const statusColors: any = {
        'QUOTED': 'bg-slate-100 text-slate-600',
        'RECRUITING': 'bg-blue-100 text-blue-700',
        'ASSIGNED': 'bg-yellow-100 text-yellow-700',
        'IN_TRANSIT': 'bg-orange-100 text-orange-700',
        'DELIVERED': 'bg-green-100 text-green-700',
        'REJECTED': 'bg-red-100 text-red-700',
    };

    const statusLabels: any = {
        'QUOTED': 'Orçamento',
        'RECRUITING': 'Recrutando',
        'ASSIGNED': 'Agendado',
        'IN_TRANSIT': 'Em Trânsito',
        'DELIVERED': 'Entregue',
        'REJECTED': 'Recusado',
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabels[status] || status}
        </span>
    )
}

export default Dashboard;
