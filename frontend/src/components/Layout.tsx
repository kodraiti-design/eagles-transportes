import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, Package, FileText, Settings, LogOut, ExternalLink, Shield, Bell, DollarSign } from 'lucide-react';
import externalLinks from '../data/externalLinks.json';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { logout, user, hasPermission } = useAuth();
    const { pendingItems } = useNotification();
    const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
    const navigate = useNavigate();

    const handleNotificationClick = (freightId: number) => {
        setIsNotificationOpen(false);
        if (window.location.pathname === '/freights') {
            const element = document.getElementById(`freight-${freightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-4', 'ring-eagles-gold', 'ring-opacity-50');
                setTimeout(() => element.classList.remove('ring-4', 'ring-eagles-gold', 'ring-opacity-50'), 2000);
            }
        } else {
            navigate(`/freights#freight-${freightId}`);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-eagles-dark text-white shadow-xl flex flex-col">
                <div className="p-6 border-b border-white/10 flex flex-col items-center">
                    <img
                        src="/logo.png"
                        alt="Eagles Transportes"
                        className="h-20 w-auto mb-2 object-contain rounded-2xl shadow-lg shadow-black/30"
                    />
                    <p className="text-xs text-slate-400 tracking-widest mt-1 mb-4">SISTEMA INTEGRADO</p>

                    {user && (
                        <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-lg border border-white/10 overflow-hidden">
                            <div className="w-6 h-6 rounded-full bg-eagles-gold text-eagles-dark flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {user.username.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-300 truncate">Olá,</p>
                                <p className="text-sm font-bold text-white truncate leading-tight">{user.username}</p>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavItem to="/freights" icon={<Package size={20} />} label="Cargas & Fretes" />
                    <NavItem to="/drivers" icon={<Truck size={20} />} label="Motoristas" />
                    <NavItem to="/clients" icon={<Users size={20} />} label="Clientes" />
                    <NavItem to="/quotations" icon={<FileText size={20} />} label="Cotações" />

                    {hasPermission('view_financial') && (
                        <NavItem to="/financial" icon={<DollarSign size={20} />} label="Financeiro" />
                    )}

                    {hasPermission('view_billing') && (
                        <NavItem to="/billing" icon={<FileText size={20} />} label="Cobranças" />
                    )}

                    <NavItem to="/settings" icon={<Settings size={20} />} label="Configurações" />

                    {user?.role === 'ADMIN' && (
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
                            <NavItem to="/users" icon={<Shield size={20} />} label="Usuários" />
                        </div>
                    )}

                    <div className="pt-6 pb-2 px-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integrações</p>
                    </div>
                    {externalLinks.map(link => (
                        <a
                            key={link.title}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                        >
                            <ExternalLink size={16} />
                            <span>{link.title}</span>
                        </a>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 text-slate-400 hover:text-red-400 w-full p-2 rounded-lg transition-colors mb-4"
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>

                    <div className="text-center pt-4 border-t border-white/5 mt-auto">
                        <p className="text-[10px] text-slate-500 leading-tight mb-2">
                            © {new Date().getFullYear()} Todos os direitos reservados por <span className="text-slate-400">Kodrai Tech Soluções em TI</span>
                        </p>
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Developed by</p>
                        <p className="text-sm font-black text-eagles-gold tracking-wider mt-0.5">KODRAI</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">Painel de Controle</h2>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div
                                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-eagles-gold transition cursor-pointer"
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            >
                                <Bell size={20} />
                                {pendingItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                        {pendingItems.length}
                                    </span>
                                )}
                            </div>

                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700 text-sm">Notificações</h3>
                                        <span className="text-xs text-slate-400">{pendingItems.length} pendentes</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {pendingItems.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                Tudo limpo! Nenhuma notificação.
                                            </div>
                                        ) : (
                                            pendingItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleNotificationClick(item.freightId)}
                                                    className="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition flex items-start space-x-3"
                                                >
                                                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${item.type === 'pickup' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">{item.description}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {item.type === 'pickup' ? 'Veículo a caminho' : 'Carga entregue'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-eagles-accent/20 to-transparent text-eagles-gold border-l-4 border-eagles-gold'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
        }
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

export default Layout;
