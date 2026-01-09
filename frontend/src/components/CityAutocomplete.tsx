import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Search, AlertCircle, Check, RefreshCw, Database } from 'lucide-react';

// Cache em memória para não reler localStorage/JSON toda hora
let globalCitiesCache: string[] = [];
let isCacheLoaded = false;

interface CityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label: string;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({ value, onChange, placeholder, label }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Status
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [dataOrigin, setDataOrigin] = useState<'json' | 'api' | null>(null);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // --- CARREGAMENTO INICIAL (JSON LOCAL OU LOCALSTORAGE) ---
    const loadCitiesLocal = async () => {
        if (isCacheLoaded && globalCitiesCache.length > 0) return;

        setLoading(true);
        try {
            // 1. Tenta LocalStorage (Base Atualizada)
            const localData = localStorage.getItem('eagles_cities_districts_db');
            if (localData) {
                globalCitiesCache = JSON.parse(localData);
                isCacheLoaded = true;
                setDataOrigin('api');
                setLoading(false);
                console.log("Localidades carregadas do LocalStorage");
                return;
            }

            // 2. Tenta Arquivo JSON Estático (Base do Sistema)
            const response = await axios.get('/cities.json');
            if (response.data && Array.isArray(response.data)) {
                globalCitiesCache = response.data;
                isCacheLoaded = true;
                setDataOrigin('json');
                console.log("Cidades carregadas do cities.json");
            }
        } catch (error) {
            console.error("Erro ao carregar base local de cidades", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCitiesLocal();
    }, []);


    // --- ATUALIZAÇÃO VIA API (BOTÃO) ---
    const handleUpdateDatabase = async () => {
        setUpdating(true);
        try {
            // Fetch Municipalities and Districts together
            const [munRes, distRes] = await Promise.all([
                axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/municipios'),
                axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/distritos')
            ]);

            const citiesSet = new Set<string>();

            // Process Municipalities
            munRes.data.forEach((city: any) => {
                citiesSet.add(`${city.nome.toUpperCase()} - ${city.microrregiao.mesorregiao.UF.sigla}`);
            });

            // Process Districts (includes neighborhoods like Santa Felicidade)
            distRes.data.forEach((dist: any) => {
                citiesSet.add(`${dist.nome.toUpperCase()} - ${dist.municipio.microrregiao.mesorregiao.UF.sigla}`);
            });

            const newCities = Array.from(citiesSet).sort();

            // Store in new key
            localStorage.setItem('eagles_cities_districts_db', JSON.stringify(newCities));

            globalCitiesCache = newCities;
            setDataOrigin('api');
            alert(`Base atualizada com SUCESSO! ${newCities.length} localidades (cidades e distritos) encontradas.`);
        } catch (error) {
            console.error("Erro ao atualizar base", error);
            alert("Erro ao conectar com IBGE. Tente novamente.");
        } finally {
            setUpdating(false);
        }
    };


    // --- FILTRO DE BUSCA ---
    useEffect(() => {
        if (!isCacheLoaded) return;

        if (!value || value.length < 2) {
            setSuggestions([]);
            return;
        }

        const searchTerm = value.toUpperCase();
        const matches: string[] = [];
        let count = 0;
        const limit = 50;

        // 1. Começa com...
        for (const city of globalCitiesCache) {
            if (city.startsWith(searchTerm)) {
                matches.push(city);
                count++;
                if (count >= limit) break;
            }
        }

        // 2. Contém...
        if (count < limit) {
            for (const city of globalCitiesCache) {
                if (!city.startsWith(searchTerm) && city.includes(searchTerm)) {
                    matches.push(city);
                    count++;
                    if (count >= limit) break;
                }
            }
        }

        setSuggestions(matches);
    }, [value, loading, updating]); // Reagir a atualizações


    // Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (city: string) => {
        onChange(city);
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                <span>{label}</span>
                <div className="flex items-center space-x-2">
                    {loading && <span className="text-xs text-eagles-gold animate-pulse">Carregando base...</span>}

                    {!loading && (
                        <button
                            type="button"
                            onClick={handleUpdateDatabase}
                            disabled={updating}
                            className="text-[10px] text-slate-400 hover:text-eagles-gold flex items-center transition-colors focus:outline-none"
                            title="Baixar lista atualizada de cidades da internet"
                        >
                            <RefreshCw size={10} className={`mr-1 ${updating ? 'animate-spin' : ''}`} />
                            {updating ? 'Atualizando...' : 'Atualizar Cidades'}
                        </button>
                    )}
                </div>
            </label>

            <div className="relative">
                <input
                    type="text"
                    className={`w-full p-2 pl-9 border rounded-lg outline-none uppercase transition-colors
                        border-slate-200 focus:ring-2 focus:ring-eagles-gold/50 bg-white
                    `}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={loading ? "CARREGANDO..." : placeholder || "DIGITE A CIDADE..."}
                />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {showSuggestions && value.length >= 2 && (
                <div className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.length > 0 ? (
                        suggestions.map((city, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSelect(city)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-50 last:border-none flex items-center"
                            >
                                <Search size={14} className="mr-2 text-slate-400" />
                                {city}
                            </button>
                        ))
                    ) : (
                        <div className="p-3 text-sm text-slate-500 text-center flex flex-col items-center">
                            <AlertCircle size={16} className="mb-1 text-slate-400" />
                            <span>Nenhuma cidade encontrada.</span>
                            <span className="text-xs text-slate-400 mt-1">Pode cadastrar manualmente.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CityAutocomplete;
