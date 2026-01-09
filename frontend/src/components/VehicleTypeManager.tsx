import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Save, XCircle } from 'lucide-react';
import Modal from './Modal';
import { API_URL } from '../utils/api';

interface VehicleType {
    id: number;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const VehicleTypeManager: React.FC<Props> = ({ isOpen, onClose, onUpdate }) => {
    const [types, setTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(false);
    const [newType, setNewType] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/vehicle_types/`);
            setTypes(response.data);
        } catch (error) {
            console.error("Error fetching types", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTypes();
        }
    }, [isOpen]);

    const handleAdd = async () => {
        if (!newType.trim()) return;
        try {
            await axios.post(`${API_URL}/vehicle_types/`, { name: newType });
            setNewType('');
            fetchTypes();
            onUpdate();
        } catch (error) {
            console.error("Error adding type", error);
            alert("Erro ao adicionar tipo. Verifique se o nome já existe.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja remover este tipo?")) return;
        try {
            await axios.delete(`${API_URL}/vehicle_types/${id}`);
            fetchTypes();
            onUpdate();
        } catch (error) {
            console.error("Error deleting type", error);
        }
    };

    const startEdit = (type: VehicleType) => {
        setEditingId(type.id);
        setEditName(type.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (id: number) => {
        try {
            await axios.put(`${API_URL}/vehicle_types/${id}`, { name: editName });
            setEditingId(null);
            fetchTypes();
            onUpdate();
        } catch (error) {
            console.error("Error updating type", error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Tipos de Veículo">
            <div className="space-y-4">
                {/* Add New */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Novo tipo (ex: Bitrenzao)"
                        className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newType.trim()}
                        className="bg-eagles-gold text-white p-2 rounded-lg hover:bg-eagles-accent disabled:opacity-50"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {loading ? (
                        <p className="text-center text-slate-500 text-sm">Carregando...</p>
                    ) : types.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm">Nenhum tipo cadastrado.</p>
                    ) : (
                        types.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                                {editingId === t.id ? (
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 p-1 border border-slate-300 rounded text-sm"
                                            autoFocus
                                        />
                                        <button onClick={() => saveEdit(t.id)} className="text-green-600 hover:text-green-800"><Save size={16} /></button>
                                        <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><XCircle size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-slate-700">{t.name}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(t)} className="text-blue-400 hover:text-blue-600">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default VehicleTypeManager;
