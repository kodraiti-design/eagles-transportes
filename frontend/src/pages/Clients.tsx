import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Building2 } from 'lucide-react';
import Modal from '../components/Modal';
import { validateCNPJ, validateCPF, formatCNPJ, formatCPF, formatPhone } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

interface Client {
    id: number;
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
}

const Clients = () => {
    const { hasPermission } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newClient, setNewClient] = useState({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: ''
    });

    const fetchClients = async () => {
        try {
            const response = await axios.get(`${API_URL}/clients/`);
            setClients(response.data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // State for CEP lookup
    const [cepLoading, setCepLoading] = useState(false);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setNewClient({ ...newClient, phone: formatted });
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const numbers = v.replace(/\D/g, '');
        let formatted = numbers;

        if (numbers.length <= 11) formatted = formatCPF(numbers);
        else formatted = formatCNPJ(numbers);

        setNewClient({ ...newClient, cnpj: formatted });
    };

    // CEP Lookup
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setCepLoading(true);
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.data.erro) {
                alert("CEP não encontrado.");
                return;
            }
            const { logradouro, bairro, localidade, uf } = response.data;
            setNewClient(prev => ({
                ...prev,
                street: logradouro,
                neighborhood: bairro,
                city: localidade,
                state: uf
            }));
        } catch (error) {
            console.error("ViaCEP Error", error);
        } finally {
            setCepLoading(false);
        }
    }

    // Handle Edit/Create Switch
    const [editingId, setEditingId] = useState<number | null>(null);

    const openNewClientModal = () => {
        setEditingId(null);
        setNewClient({ name: '', cnpj: '', phone: '', email: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' });
        setIsModalOpen(true);
    }

    const openEditClientModal = (client: Client) => {
        setEditingId(client.id);
        const numbers = client.cnpj.replace(/\D/g, '');
        setNewClient({
            name: client.name,
            cnpj: numbers.length > 11 ? formatCNPJ(numbers) : formatCPF(numbers),
            phone: client.phone,
            email: client.email,
            cep: client.cep || '',
            street: client.street || '',
            number: client.number || '',
            neighborhood: client.neighborhood || '',
            city: client.city || '',
            state: client.state || '',
            complement: client.complement || ''
        });
        setIsModalOpen(true);
    }

    const handleDeleteClient = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
        try {
            await axios.delete(`${API_URL}/clients/${id}`);
            fetchClients();
        } catch (error) {
            console.error("Error deleting client", error);
            alert("Erro ao excluir cliente");
        }
    }

    const handleClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const cleanDoc = newClient.cnpj.replace(/\D/g, '');
        let isValid = false;

        if (cleanDoc.length === 11) {
            isValid = validateCPF(cleanDoc);
        } else if (cleanDoc.length === 14) {
            isValid = validateCNPJ(cleanDoc);
        } else {
            alert("Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.");
            return;
        }

        if (!isValid) {
            alert("CPF ou CNPJ inválido. Verifique o número digitado.");
            return;
        }

        try {
            if (editingId) {
                await axios.put(`${API_URL}/clients/${editingId}`, newClient);
            } else {
                await axios.post(`${API_URL}/clients/`, newClient);
            }
            setIsModalOpen(false);
            fetchClients();
            setEditingId(null);
            setNewClient({ name: '', cnpj: '', phone: '', email: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' });
        } catch (error: any) {
            console.error("Error saving client", error);
            let msg = "Erro desconhecido";
            if (error.response) {
                if (error.response.status === 422) {
                    msg = "Erro de validação: " + JSON.stringify(error.response.data.detail);
                } else {
                    msg = error.response.data.detail || "Erro no servidor.";
                }
            } else {
                msg = error.message;
            }
            alert(`Falha: ${msg}`);
        }
    }

    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cnpj.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
                    <p className="text-slate-500">Cadastro de empresas e parceiros</p>
                </div>
                {hasPermission('create_client') && (
                    <button onClick={openNewClientModal} className="premium-btn flex items-center space-x-2">
                        <Plus size={18} />
                        <span>Novo Cliente</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNPJ..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-eagles-gold/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4">CNPJ</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Localização</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8">Carregando...</td></tr>
                            ) : filteredClients.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Nenhum cliente encontrado.</td></tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/80 transition group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="font-medium text-slate-700">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {client.cnpj.replace(/\D/g, '').length > 11 ? formatCNPJ(client.cnpj) : formatCPF(client.cnpj)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="text-sm">{client.phone}</div>
                                            <div className="text-xs text-slate-400">{client.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                            {client.city} - {client.state}
                                            <div className="text-xs text-slate-400">{client.street || 'Endereço não inf.'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {hasPermission('edit_client') && (
                                                    <button
                                                        onClick={() => openEditClientModal(client)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Editar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                    </button>
                                                )}
                                                {hasPermission('delete_client') && (
                                                    <button
                                                        onClick={() => handleDeleteClient(client.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Excluir"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Cliente" : "Cadastrar Novo Cliente"}>
                <form onSubmit={handleClientSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social / Nome</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                            value={newClient.name}
                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                            <input
                                required
                                type="text"
                                placeholder="00.000.000/0001-00"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={newClient.cnpj}
                                onChange={handleCnpjChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                            <input
                                required
                                type="text"
                                placeholder="(41) 9 9999-9999"
                                maxLength={16}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                value={newClient.phone}
                                onChange={handlePhoneChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                            value={newClient.email}
                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Endereço</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                        value={newClient.cep}
                                        onChange={(e) => setNewClient({ ...newClient, cep: e.target.value })}
                                        onBlur={handleCepBlur}
                                    />
                                    {cepLoading && <div className="absolute right-2 top-2 w-4 h-4 rounded-full border-2 border-slate-300 border-t-eagles-gold animate-spin"></div>}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rua / Logradouro</label>
                                <input
                                    type="text"
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                    value={newClient.street}
                                    onChange={(e) => setNewClient({ ...newClient, street: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                                <input
                                    type="text"
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                    value={newClient.number}
                                    onChange={(e) => setNewClient({ ...newClient, number: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label>
                                <input
                                    type="text"
                                    placeholder="Apto/Sala"
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                    value={newClient.complement || ''}
                                    onChange={(e) => setNewClient({ ...newClient, complement: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                    value={newClient.neighborhood}
                                    onChange={(e) => setNewClient({ ...newClient, neighborhood: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                    value={newClient.city}
                                    onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none uppercase"
                                    value={newClient.state}
                                    onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-eagles-gold text-white px-4 py-2 rounded-lg font-bold hover:bg-eagles-accent transition">
                            Salvar Cliente
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Clients;
