import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, User, AlertCircle } from 'lucide-react';

interface Client {
    id: number;
    name: string;
}

interface ClientAutocompleteProps {
    clients: Client[];
    value: string; // client_id as string
    onChange: (value: string) => void;
    placeholder?: string;
}

const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({ clients, value, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initialize search term when value changes externally (e.g. edit mode)
    useEffect(() => {
        if (value) {
            const selectedClient = clients.find(c => c.id.toString() === value);
            if (selectedClient) {
                setSearchTerm(selectedClient.name);
            }
        } else {
            setSearchTerm('');
        }
    }, [value, clients]);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search term to match value if closed without selection
                if (value) {
                    const selected = clients.find(c => c.id.toString() === value);
                    if (selected && searchTerm !== selected.name) {
                        setSearchTerm(selected.name);
                    }
                } else {
                    if (searchTerm !== '') setSearchTerm('');
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, value, clients, searchTerm]);

    const handleSelect = (client: Client) => {
        onChange(client.id.toString());
        setSearchTerm(client.name);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full p-2 pl-9 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none bg-white"
                    placeholder={placeholder || "Selecione um cliente..."}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        // If user clears input, clear value
                        if (e.target.value === '') {
                            onChange('');
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                            <button
                                key={client.id}
                                type="button"
                                onClick={() => handleSelect(client)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-50 last:border-none last:rounded-b-lg first:rounded-t-lg"
                            >
                                {client.name}
                            </button>
                        ))
                    ) : (
                        <div className="p-3 text-sm text-slate-500 text-center flex flex-col items-center">
                            <AlertCircle size={16} className="mb-1 text-slate-400" />
                            <span>Nenhum cliente encontrado.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientAutocomplete;
