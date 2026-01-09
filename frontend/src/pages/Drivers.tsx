import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Search, Plus, MoreHorizontal, Filter, Settings, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import VehicleTypeManager from '../components/VehicleTypeManager';
import { formatCPF, formatLicensePlate, formatPhone } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

interface Driver {
    id: number;
    name: string;
    phone: string;
    vehicle_type: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    cpf: string;
    vehicle_plate: string;
    antt?: string;
}

const Drivers = () => {
    const { hasPermission } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Actions Menu State
    const [activeActionId, setActiveActionId] = useState<number | null>(null);
    const [activeStatusId, setActiveStatusId] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    // Vehicle Types
    const [vehicleTypes, setVehicleTypes] = useState<{ id: number, name: string }[]>([]);
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);

    const [formData, setFormData] = useState({
        id: undefined as number | undefined,
        name: '',
        phone: '',
        cpf: '',
        vehicle_type: '',
        vehicle_plate: '',
        antt: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'PENDING'
    });

    const fetchDrivers = async () => {
        try {
            const response = await axios.get(`${API_URL}/drivers/`);
            setDrivers(response.data);
        } catch (error) {
            console.error("Failed to fetch drivers", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            const response = await axios.get(`${API_URL}/vehicle_types/`);
            setVehicleTypes(response.data);
            // Default select
            if (response.data.length > 0 && !formData.vehicle_type) {
                setFormData(prev => ({ ...prev, vehicle_type: response.data[0].name }));
            }
        } catch (error) {
            console.error("Failed to fetch vehicle types", error);
        }
    };

    const resetForm = () => {
        setFormData({
            id: undefined,
            name: '',
            phone: '',
            cpf: '',
            vehicle_type: vehicleTypes.length > 0 ? vehicleTypes[0].name : '',
            vehicle_plate: '',
            antt: '',
            status: 'ACTIVE'
        });
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (driver: Driver) => {
        setFormData({
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            cpf: driver.cpf,
            vehicle_type: driver.vehicle_type,
            vehicle_plate: driver.vehicle_plate,
            antt: driver.antt || '',
            status: driver.status as 'ACTIVE' | 'INACTIVE' | 'PENDING'
        });
        setActiveActionId(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await axios.put(`${API_URL}/drivers/${formData.id}`, formData);
            } else {
                await axios.post(`${API_URL}/drivers/`, formData);
            }
            setIsModalOpen(false);
            fetchDrivers();
            resetForm();
        } catch (error: any) {
            console.error("Error saving driver", error);
            const errorMessage = error.response?.data?.detail || "Erro desconhecido ao salvar motorista";
            alert(`Erro ao salvar: ${errorMessage}`);
        }
    };

    useEffect(() => {
        fetchDrivers();
        fetchVehicleTypes();
    }, []);

    const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, driverId: number) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.right - 180 + window.scrollX
        });
        setActiveActionId(activeActionId === driverId ? null : driverId);
        setActiveStatusId(null);
    };

    const handleStatusClick = (e: React.MouseEvent<HTMLButtonElement>, driverId: number) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX
        });
        setActiveStatusId(activeStatusId === driverId ? null : driverId);
        setActiveActionId(null);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveActionId(null);
            setActiveStatusId(null);
        };
        if (activeActionId || activeStatusId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeActionId, activeStatusId]);

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await axios.patch(`${API_URL}/drivers/${id}/status?status=${newStatus}`);
            fetchDrivers();
            setActiveStatusId(null);
        } catch (error: any) {
            console.error("Error updating status", error);
            const errorMessage = error.response?.data?.detail || error.message || "Erro desconhecido";
            alert(`Erro ao atualizar status: ${errorMessage}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        try {
            await axios.delete(`${API_URL}/drivers/${id}`);
            fetchDrivers();
        } catch (error) {
            console.error("Error deleting driver", error);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredDrivers = drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.cpf.includes(searchTerm) ||
        (driver.vehicle_plate && driver.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Motoristas</h1>
                    <p className="text-slate-500">Gerencie sua frota de parceiros</p>
                </div>
                {hasPermission('create_driver') && (
                    <button onClick={handleOpenCreate} className="premium-btn flex items-center space-x-2">
                        <Plus size={18} />
                        <span>Novo Motorista</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou placa..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-eagles-gold/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                        <Filter size={20} />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Veículo</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8">Carregando...</td></tr>
                            ) : filteredDrivers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Nenhum motorista encontrado.</td></tr>
                            ) : (
                                filteredDrivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-slate-50/80 transition relative">
                                        <td className="px-6 py-4 font-medium text-slate-700">{driver.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{driver.phone}</td>
                                        <td className="px-6 py-4 text-slate-600">{driver.vehicle_type || '-'}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => handleStatusClick(e, driver.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all hover:shadow-sm flex items-center gap-1 ${driver.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                                                    driver.status === 'INACTIVE' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' :
                                                        'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
                                                    }`}
                                            >
                                                {driver.status === 'ACTIVE' ? 'ATIVO' :
                                                    driver.status === 'INACTIVE' ? 'INATIVO' : 'PENDENTE'}
                                                <Settings size={12} className="opacity-50" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => handleActionClick(e, driver.id)}
                                                className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${activeActionId === driver.id ? 'text-eagles-gold bg-slate-100' : 'text-slate-400 hover:text-eagles-gold'}`}
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Portal Actions Menu */}
            {activeActionId && menuPosition && createPortal(
                <div
                    className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden animation-fade-in"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-1">
                        {hasPermission('edit_driver') && (
                            <button
                                onClick={() => {
                                    const driver = drivers.find(d => d.id === activeActionId);
                                    if (driver) handleEdit(driver);
                                }}
                                className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-medium transition-colors"
                            >
                                <Edit2 size={16} className="text-blue-500" />
                                Editar Dados
                            </button>
                        )}
                        {hasPermission('delete_driver') && (
                            <>
                                <div className="my-1 border-t border-slate-100"></div>
                                <button
                                    onClick={() => handleDelete(activeActionId)}
                                    className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 font-medium transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Excluir Motorista
                                </button>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Portal Status Menu */}
            {activeStatusId && menuPosition && createPortal(
                <div
                    className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden animation-fade-in"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Alterar Status
                    </div>
                    <div className="p-1">
                        <button
                            onClick={() => handleStatusChange(activeStatusId, 'ACTIVE')}
                            className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                            <CheckCircle size={16} className="text-green-500" />
                            Ativo
                        </button>
                        <button
                            onClick={() => handleStatusChange(activeStatusId, 'INACTIVE')}
                            className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                            <XCircle size={16} className="text-red-500" />
                            Inativo
                        </button>
                        <button
                            onClick={() => handleStatusChange(activeStatusId, 'PENDING')}
                            className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                            <AlertTriangle size={16} className="text-yellow-500" />
                            Pendente
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Editar Motorista" : "Cadastrar Novo Motorista"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                            <input
                                required
                                type="text"
                                placeholder="(41) 9 9999-9999"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                                maxLength={16}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={formData.cpf}
                                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                maxLength={14}
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Veículo</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none bg-white"
                                    value={formData.vehicle_type}
                                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {vehicleTypes.map(type => (
                                        <option key={type.id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsTypeManagerOpen(true)}
                                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-eagles-gold"
                                    title="Gerenciar Tipos"
                                >
                                    <Settings size={20} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none uppercase"
                                value={formData.vehicle_plate}
                                onChange={(e) => setFormData({ ...formData, vehicle_plate: formatLicensePlate(e.target.value) })}
                                maxLength={8}
                                placeholder="ABC-1234 ou ABC 1C34"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ANTT (RNTRC)</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none uppercase"
                            value={formData.antt}
                            onChange={(e) => setFormData({ ...formData, antt: e.target.value })}
                            placeholder="Ex: 12345678"
                        />
                    </div>

                    {formData.id && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none bg-white"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="ACTIVE">Ativo</option>
                                <option value="INACTIVE">Inativo</option>
                                <option value="PENDING">Pendente</option>
                            </select>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-eagles-gold text-white px-4 py-2 rounded-lg font-bold hover:bg-eagles-accent transition">
                            {formData.id ? 'Salvar Alterações' : 'Salvar Motorista'}
                        </button>
                    </div>
                </form>
            </Modal>

            <VehicleTypeManager
                isOpen={isTypeManagerOpen}
                onClose={() => setIsTypeManagerOpen(false)}
                onUpdate={fetchVehicleTypes}
            />
        </div>
    );
};

export default Drivers;
