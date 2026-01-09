import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, MessageCircle, MapPin, UserCheck, UserPlus, Calculator, Copy, Camera, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { WhatsAppTemplates, openWhatsApp } from '../utils/whatsapp';
import { format } from 'date-fns';
import Modal from '../components/Modal';
import CityAutocomplete from '../components/CityAutocomplete';
import ClientAutocomplete from '../components/ClientAutocomplete';
import FreightCalculator from '../components/FreightCalculator';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../utils/api';

interface Freight {
    id: number;
    origin: string;
    destination: string;
    pickup_date: string;
    delivery_date: string;
    status: string;
    valor_motorista: number;
    valor_cliente: number;
    observation?: string;
    rejection_reason?: string;
    delivery_photos?: string;
    driver_id?: number;
    driver?: {
        name: string;
        phone: string;
        vehicle_plate?: string;
        vehicle_type?: string;
        cpf?: string;
        antt?: string;
    };
    client?: {
        id: number;
        name: string;
        phone: string;
    };
}

interface Client {
    id: number;
    name: string;
}

interface Driver {
    id: number;
    name: string;
    vehicle_plate: string;
    vehicle_type: string;
    is_blocked: boolean;
    status: string;
    antt?: string;
}

interface Template {
    id: number;
    name: string;
    slug: string;
    content: string;
}

const Freights = () => {
    const { hasPermission } = useAuth();
    const [freights, setFreights] = useState<Freight[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [selectedFreightId, setSelectedFreightId] = useState<number | null>(null);

    // Form State
    const [newFreight, setNewFreight] = useState({
        client_id: '',
        origin: '',
        destination: '',
        pickup_date: '',
        delivery_date: '',
        valor_motorista: '',
        valor_cliente: '',
        status: 'QUOTED',
        observation: ''
    });

    const fetchData = async () => {
        try {
            const [freightsRes, clientsRes, driversRes, templatesRes] = await Promise.all([
                axios.get(`${API_URL}/freights/`),
                axios.get(`${API_URL}/clients/`),
                axios.get(`${API_URL}/drivers/`),
                axios.get(`${API_URL}/templates/`)
            ]);
            setFreights(freightsRes.data);
            setClients(clientsRes.data);
            setDrivers(driversRes.data);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setNewFreight({ client_id: '', origin: '', destination: '', pickup_date: '', delivery_date: '', valor_motorista: '', valor_cliente: '', status: 'QUOTED', observation: '' });
        setSelectedFreightId(null);
    }

    const handleCreateOrUpdateFreight = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newFreight,
                client_id: parseInt(newFreight.client_id),
                valor_motorista: parseFloat(newFreight.valor_motorista),
                valor_cliente: parseFloat(newFreight.valor_cliente),
                pickup_date: new Date(newFreight.pickup_date).toISOString(),
                delivery_date: new Date(newFreight.delivery_date).toISOString(),
            };

            if (selectedFreightId) {
                // Update Mode
                await axios.put(`${API_URL}/freights/${selectedFreightId}`, payload);
                alert("Frete atualizado com sucesso!");
            } else {
                // Create Mode
                await axios.post(`${API_URL}/freights/`, payload);
            }

            setIsCreateModalOpen(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error creating/updating freight", error);
            alert("Erro ao salvar frete. Verifique os dados.");
        }
    }

    const handleEdit = (freight: Freight) => {
        setSelectedFreightId(freight.id);
        setNewFreight({
            client_id: freight.client?.id.toString() || '',
            origin: freight.origin,
            destination: freight.destination,
            pickup_date: freight.pickup_date.slice(0, 16), // Format for datetime-local input
            delivery_date: freight.delivery_date.slice(0, 16),
            valor_motorista: freight.valor_motorista.toString(),
            valor_cliente: freight.valor_cliente.toString(),
            status: freight.status,
            observation: freight.observation || ''
        });
        setIsCreateModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja EXCLUIR este frete? A ação é irreversível.")) return;
        try {
            await axios.delete(`${API_URL}/freights/${id}`);
            fetchData();
            alert("Frete excluído.");
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir frete.");
        }
    };

    const handleAssignDriver = async (driverId: number) => {
        if (!selectedFreightId) return;
        try {
            await axios.patch(`${API_URL}/freights/${selectedFreightId}/assign/${driverId}`);
            setIsAssignModalOpen(false);
            setSelectedFreightId(null);
            fetchData();
        } catch (error) {
            console.error("Error signing driver", error);
            alert("Erro ao atribuir motorista.");
        }
    }

    const openAssignModal = (freightId: number) => {
        setSelectedFreightId(freightId);
        setIsAssignModalOpen(true);
    }

    const handleWhatsAppAction = (freight: Freight) => {
        if (!freight.driver) return;

        let message = "";
        const driverName = freight.driver.name;
        const driverPhone = freight.driver.phone;
        const plate = freight.driver.vehicle_plate || "PLACA-???";

        switch (freight.status) {
            case 'QUOTED':
            case 'RECRUITING':
                message = `Olá *${driverName}*, aqui é da *Eagles Transportes*.\n\nTemos um frete *#${freight.id}* de *${freight.origin}* para *${freight.destination}*.\nValor: R$ ${freight.valor_motorista}.\n\nTem interesse? Acesse o link abaixo:\n\n${window.location.origin}/driver-acceptance/${freight.id}`;
                break;
            case 'ASSIGNED':
                message = WhatsAppTemplates.driverAvailable(plate, freight.origin);
                break;
            case 'IN_TRANSIT':
                message = WhatsAppTemplates.arrivedDelivery(driverName);
                break;
            case 'DELIVERED':
                message = WhatsAppTemplates.finished(driverName);
                break;
            default:
                message = `Olá *${driverName}*, sobre o frete #${freight.id}...`;
        }

        openWhatsApp(driverPhone, message);
    };

    const { setPendingItems } = useNotification();
    const [notifiedState, setNotifiedState] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('eagles_notified_freights');
        return saved ? JSON.parse(saved) : {};
    });

    // Update global notification count
    // Update global notification list
    useEffect(() => {
        if (loading) return;

        const items: any[] = [];

        freights.forEach(freight => {
            const key = `${freight.id}_${freight.status}`;
            const isNotified = notifiedState[key];

            if (!freight.driver) return;

            if (freight.status === 'IN_TRANSIT' && !isNotified) {
                items.push({
                    id: key,
                    freightId: freight.id,
                    status: freight.status,
                    type: 'pickup',
                    description: `Frete #${freight.id}: Confirmar Coleta`
                });
            } else if (freight.status === 'DELIVERED' && !isNotified) {
                items.push({
                    id: key,
                    freightId: freight.id,
                    status: freight.status,
                    type: 'delivery',
                    description: `Frete #${freight.id}: Confirmar Entrega`
                });
            }
        });

        setPendingItems(items);
    }, [freights, notifiedState, loading, setPendingItems]);

    // Scroll to section handling
    useEffect(() => {
        if (!loading && window.location.hash) {
            const id = window.location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-4', 'ring-eagles-gold', 'ring-opacity-50');
                setTimeout(() => element.classList.remove('ring-4', 'ring-eagles-gold', 'ring-opacity-50'), 2000);
            }
        }
    }, [loading, window.location.hash]);

    const notifyClient = (freight: Freight) => {
        if (!freight.driver) return;

        // Mark as notified for this specific status
        const notificationKey = `${freight.id}_${freight.status}`;
        if (!notifiedState[notificationKey]) {
            const newState = { ...notifiedState, [notificationKey]: true };
            setNotifiedState(newState);
            localStorage.setItem('eagles_notified_freights', JSON.stringify(newState));
        }

        const clientPhone = freight.client?.phone;
        if (!clientPhone) {
            alert("Cliente sem telefone cadastrado!");
            return;
        }

        const cleanPhone = clientPhone.replace(/\D/g, '');
        let msg = "";

        // Smart Notification Logic
        if (freight.status === 'IN_TRANSIT') {
            msg = WhatsAppTemplates.pickupConfirmation(
                freight.driver.vehicle_plate || '---',
                freight.origin
            );
        }
        else if (freight.status === 'DELIVERED') {
            msg = WhatsAppTemplates.deliveryConfirmation(freight.driver.name);
        }
        else {
            // Default: Send Driver Data
            msg = WhatsAppTemplates.driverData(
                freight.driver.name,
                freight.driver.cpf || '---',
                freight.driver.antt || '---',
                freight.driver.vehicle_plate || '---',
                freight.origin
            );
        }

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }

    const handleCopyDriverLink = (freightId: number) => {
        const link = `${window.location.origin}/driver-acceptance/${freightId}`;
        navigator.clipboard.writeText(link);
        alert("Link copiado! Envie para o motorista.");
    };

    const handleViewPhotos = (photosJson: string) => {
        try {
            const photos = JSON.parse(photosJson);
            setSelectedPhotos(photos);
            setIsPhotosModalOpen(true);
        } catch (e) {
            console.error("Error parsing photos", e);
            alert("Erro ao abrir fotos.");
        }
    };

    const getFilteredSortedFreights = () => {
        let filtered = [...freights];

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(f => f.status === statusFilter);
        }

        // Sort Order: Active first, then Delivered/Rejected last
        const statusPriority: any = {
            'IN_TRANSIT': 1,
            'ASSIGNED': 2,
            'RECRUITING': 3,
            'QUOTED': 4,
            'DELIVERED': 9,
            'REJECTED': 10
        };

        filtered.sort((a, b) => {
            const priorityA = statusPriority[a.status] || 99;
            const priorityB = statusPriority[b.status] || 99;
            if (priorityA !== priorityB) return priorityA - priorityB;
            // Secondary sort: ID descending (newest first)
            return b.id - a.id;
        });

        return filtered;
    };

    const statusCounts = freights.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    const statusOptions = [
        { value: 'ALL', label: `Todos (${freights.length})` },
        { value: 'QUOTED', label: `Orçamento (${statusCounts['QUOTED'] || 0})` },
        { value: 'RECRUITING', label: `Recrutando (${statusCounts['RECRUITING'] || 0})` },
        { value: 'ASSIGNED', label: `Agendado (${statusCounts['ASSIGNED'] || 0})` },
        { value: 'IN_TRANSIT', label: `Em Trânsito (${statusCounts['IN_TRANSIT'] || 0})` },
        { value: 'DELIVERED', label: `Entregue (${statusCounts['DELIVERED'] || 0})` },
        { value: 'REJECTED', label: `Recusado (${statusCounts['REJECTED'] || 0})` },
    ];

    const filteredFreights = getFilteredSortedFreights();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cargas & Fretes</h1>
                    <p className="text-slate-500">Gestão de programação e status</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsCalculatorOpen(true)}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition flex items-center shadow-sm"
                    >
                        <Calculator size={18} className="mr-2 text-eagles-gold" />
                        <span>Calculadora ANTT</span>
                    </button>
                    {hasPermission('create_freight') && (
                        <button
                            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                            className="premium-btn flex items-center space-x-2"
                        >
                            <Plus size={18} />
                            <span>Novo Frete</span>
                        </button>
                    )}
                </div>
            </div>

            <FreightCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

            {/* Filter Bar */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {statusOptions.map(option => (
                    <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors
                            ${statusFilter === option.value
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}
                        `}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFreights.map(freight => (
                    <FreightCard
                        key={freight.id}
                        freight={freight}
                        isNotified={notifiedState[`${freight.id}_${freight.status}`]}
                        onWhatsApp={() => handleWhatsAppAction(freight)}
                        onNotifyClient={() => notifyClient(freight)}
                        onAssign={() => openAssignModal(freight.id)}
                        onCopyLink={() => handleCopyDriverLink(freight.id)}
                        onViewPhotos={() => handleViewPhotos(freight.delivery_photos || '[]')}
                        onEdit={() => handleEdit(freight)}
                        onDelete={() => handleDelete(freight.id)}
                        hasPermission={hasPermission}
                    />
                ))}
                {freights.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                        <p>Nenhuma carga programada encontrada.</p>
                        {hasPermission('create_freight') && (
                            <button onClick={() => { resetForm(); setIsCreateModalOpen(true); }} className="mt-4 text-eagles-gold font-bold hover:underline">Criar a primeira carga</button>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={selectedFreightId ? `Editar Frete #${selectedFreightId}` : "Nova Carga / Frete"}>
                <form onSubmit={handleCreateOrUpdateFreight} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status (Manual)</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none bg-blue-50 font-bold text-slate-700"
                                value={newFreight.status}
                                onChange={(e) => setNewFreight({ ...newFreight, status: e.target.value })}
                            >
                                <option value="QUOTED">Orçamento</option>
                                <option value="RECRUITING">Recrutando</option>
                                <option value="ASSIGNED">Agendado (Carga Aceita)</option>
                                <option value="IN_TRANSIT">Em Trânsito</option>
                                <option value="DELIVERED">Entregue</option>
                                <option value="REJECTED">Recusado</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                            <ClientAutocomplete
                                clients={clients}
                                value={newFreight.client_id}
                                onChange={(val) => setNewFreight({ ...newFreight, client_id: val })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <CityAutocomplete
                                label="Origem"
                                value={newFreight.origin}
                                onChange={(val) => setNewFreight({ ...newFreight, origin: val })}
                                placeholder="Cidade de Coleta"
                            />
                        </div>
                        <div>
                            <CityAutocomplete
                                label="Destino"
                                value={newFreight.destination}
                                onChange={(val) => setNewFreight({ ...newFreight, destination: val })}
                                placeholder="Cidade de Entrega"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Coleta</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={newFreight.pickup_date}
                                onChange={(e) => setNewFreight({ ...newFreight, pickup_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Entrega</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={newFreight.delivery_date}
                                onChange={(e) => setNewFreight({ ...newFreight, delivery_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Motorista (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={newFreight.valor_motorista}
                                onChange={(e) => setNewFreight({ ...newFreight, valor_motorista: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Cliente (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={newFreight.valor_cliente}
                                onChange={(e) => setNewFreight({ ...newFreight, valor_cliente: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                        <textarea
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none h-24 resize-none"
                            placeholder="Instruções especiais, detalhes da carga, etc."
                            value={newFreight.observation}
                            onChange={(e) => setNewFreight({ ...newFreight, observation: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-eagles-gold text-white px-4 py-2 rounded-lg font-bold hover:bg-eagles-accent transition">
                            Salvar Carga
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assign Driver Modal */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Atribuir Motorista">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Filtrar motoristas..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-eagles-gold/50"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
                        {drivers.filter(d => !d.is_blocked && d.status !== 'INACTIVE').map(driver => (
                            <button
                                key={driver.id}
                                onClick={() => handleAssignDriver(driver.id)}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between items-center transition group ${driver.status === 'PENDING' ? 'bg-amber-50/50' : ''}`}
                            >
                                <div className="flex-1 overflow-hidden mr-3">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-800 truncate">{driver.name}</p>
                                        {driver.status === 'PENDING' && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-200 flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                PENDENTE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                        {driver.vehicle_type} • {driver.vehicle_plate || 'Sem placa'}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-eagles-gold transition-opacity">
                                    <Plus size={20} />
                                </div>
                            </button>
                        ))}
                        {drivers.filter(d => !d.is_blocked && d.status !== 'INACTIVE').length === 0 && (
                            <p className="text-center py-4 text-slate-400 text-sm">Nenhum motorista disponível.</p>
                        )}
                    </div>
                    {/* Helper Message for Pending Drivers */}
                    <p className="text-xs text-slate-400 text-center">
                        <AlertTriangle size={12} className="inline mr-1 mb-0.5" />
                        Motoristas com status <b>PENDENTE</b> podem ter documentos incompletos.
                    </p>
                </div>
            </Modal>

            {/* Photos Modal */}
            <Modal isOpen={isPhotosModalOpen} onClose={() => setIsPhotosModalOpen(false)} title="Comprovantes de Entrega">
                <div className="grid grid-cols-2 gap-4">
                    {selectedPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                            <img
                                src={`${API_URL}/${photo}`}
                                alt={`Comprovante ${idx + 1}`}
                                className="w-full h-auto object-cover"
                            />
                            <a
                                href={`${API_URL}/${photo}`}
                                target="_blank"
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold"
                            >
                                Ver Original
                            </a>
                        </div>
                    ))}
                    {selectedPhotos.length === 0 && <p className="text-center text-slate-500 w-full col-span-2">Nenhuma foto encontrada.</p>}
                </div>
            </Modal>
        </div>
    );
};

interface FreightCardProps {
    freight: Freight;
    isNotified?: boolean;
    onWhatsApp: () => void;
    onNotifyClient: () => void;
    onAssign: () => void;
    onCopyLink: () => void;
    onViewPhotos: () => void;
    onEdit: () => void;
    onDelete: () => void;
    hasPermission: (permission: string) => boolean;
}

const FreightCard = ({ freight, isNotified, onWhatsApp, onNotifyClient, onAssign, onCopyLink, onViewPhotos, onEdit, onDelete, hasPermission }: FreightCardProps) => {
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

    const getStatusLabel = () => {
        if (freight.status === 'RECRUITING' && freight.driver) {
            return <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">Aguardando Aceite</span>;
        }
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusColors[freight.status]}`}>
                {statusLabels[freight.status]}
            </span>
        );
    };

    return (
        <div id={`freight-${freight.id}`} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${statusColors[freight.status].split(' ')[0].replace('bg-', 'bg-')}`}></div>

            <div className="flex justify-between items-start mb-4 pl-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">#{freight.id}</span>
                    {getStatusLabel()}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={onCopyLink} className="p-1 text-slate-400 hover:text-eagles-gold hover:bg-slate-50 rounded transition" title="Copiar Link para Motorista">
                        <Copy size={16} />
                    </button>
                    {hasPermission('edit_freight') && (
                        <button onClick={onEdit} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded transition" title="Editar Frete">
                            <Edit size={16} />
                        </button>
                    )}
                    {hasPermission('delete_freight') && (
                        <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition" title="Excluir Frete">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center mb-4 pl-3">
                <span className="text-2xl font-bold text-slate-800 flex items-center">
                    <span className="mr-1 text-slate-400 text-sm">R$</span>
                    {freight.valor_motorista}
                </span>
            </div>

            <div className="space-y-3 pl-3">
                <div className="flex items-start space-x-3">
                    <MapPin className="text-eagles-gold mt-1 flex-shrink-0" size={16} />
                    <div>
                        <p className="text-xs text-slate-400 uppercase">Coleta</p>
                        <p className="font-semibold text-slate-700 leading-tight">{freight.origin}</p>
                        <p className="text-xs text-slate-500">{format(new Date(freight.pickup_date), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </div>

                <div className="h-6 border-l border-dashed border-slate-300 ml-[7px]"></div>

                <div className="flex items-start space-x-3">
                    <MapPin className="text-slate-400 mt-1 flex-shrink-0" size={16} />
                    <div>
                        <p className="text-xs text-slate-400 uppercase">Entrega</p>
                        <p className="font-semibold text-slate-700 leading-tight">{freight.destination}</p>
                        <p className="text-xs text-slate-500">{format(new Date(freight.delivery_date), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </div>

                {freight.observation && (
                    <div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-800 border border-amber-100 mt-2">
                        <span className="font-bold mr-1">Obs:</span> {freight.observation}
                    </div>
                )}

                {freight.rejection_reason && (
                    <div className="bg-red-50 rounded-lg p-2 text-xs text-red-800 border border-red-100 mt-2 flex items-start">
                        <AlertTriangle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="font-bold">Motivo Recusa:</span> {freight.rejection_reason}
                        </div>
                    </div>
                )}

                {freight.driver ? (
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg mt-2 cursor-pointer hover:bg-slate-100 transition" onClick={onAssign} title="Trocar Motorista">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                            {freight.driver.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-slate-700 truncate">{freight.driver.name}</p>
                            <p className="text-xs text-slate-400">{freight.driver.vehicle_plate || 'Sem Placa'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-2 rounded-lg mt-2 text-center border border-dashed border-slate-300">
                        <p className="text-sm text-slate-400 italic">Sem motorista</p>
                        <button onClick={onAssign} className="text-xs text-eagles-gold font-bold hover:underline mt-1 flex items-center justify-center w-full">
                            <UserPlus size={14} className="mr-1" />
                            Atribuir Agora
                        </button>
                    </div>
                )}

                {freight.status === 'DELIVERED' && freight.delivery_photos && (
                    <button
                        onClick={onViewPhotos}
                        className="w-full mt-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold py-2 rounded-lg flex items-center justify-center transition"
                    >
                        <Camera size={14} className="mr-2" />
                        Ver Comprovantes
                    </button>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 pl-3">
                <button
                    onClick={onWhatsApp}
                    disabled={!freight.driver}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center transition ${!freight.driver ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                    title="Falar com Motorista / Atualizar Status"
                >
                    <MessageCircle size={16} className="mr-2" />
                    Motorista
                </button>
                <button
                    onClick={onNotifyClient}
                    disabled={!freight.driver}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center transition 
                        ${isNotified ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' :
                            freight.status === 'DELIVERED' ? 'bg-green-600 text-white hover:bg-green-700 animate-pulse' :
                                freight.status === 'IN_TRANSIT' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                    !freight.driver ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                    title="Notificar Cliente"
                >
                    <UserCheck size={16} className="mr-2" />
                    {isNotified ? 'Avisado' :
                        freight.status === 'DELIVERED' ? 'Avisar Entrega' :
                            freight.status === 'IN_TRANSIT' ? 'Avisar Coleta' : 'Dados Motorista'}
                </button>
            </div>

            <a
                href="https://app.gerencieaqui.com.br/selecao-empresa/"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-3 mt-3 mb-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center transition border border-slate-200 group-hover:border-slate-300"
            >
                <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <span>Emitir CTe / NF-e</span>
                </div>
            </a>
        </div>
    )
}

export default Freights;
