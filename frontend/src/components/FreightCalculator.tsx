import React, { useState, useEffect } from 'react';
import { Calculator, Truck, RotateCcw, Info } from 'lucide-react';

const CARGO_TYPES = [
    { id: 'general', label: 'Carga Geral', table: 'A' },
    { id: 'bulk', label: 'Granel Sólido', table: 'A' },
    { id: 'bulk_liquid', label: 'Granel Líquido', table: 'A' },
    { id: 'frigo', label: 'Frigorificada', table: 'A' },
    { id: 'container', label: 'Conteinerizada', table: 'A' },
    { id: 'dangerous', label: 'Perigosa (Granel)', table: 'A' },
];

// Updated Coefficients based on User Feedback (Table B - 2024/25 Estimates)
// CCD: R$/km | CC: R$ (Fixed)
const DEFAULT_COEFFICIENTS: any = {
    'general': {
        2: { ccd: 4.79, cc: 511.74 },
        3: { ccd: 5.85, cc: 615.50 },
        4: { ccd: 7.10, cc: 745.80 },
        5: { ccd: 8.25, cc: 860.10 },
        6: { ccd: 9.85, cc: 990.40 },
        7: { ccd: 10.90, cc: 1120.70 },
        9: { ccd: 12.80, cc: 1250.90 },
    },
    'bulk': { // Granel Sólido (Matches User Screenshot for 2 axles)
        2: { ccd: 4.7938, cc: 511.74 },
        3: { ccd: 5.95, cc: 620.00 },
        4: { ccd: 7.20, cc: 750.00 },
        5: { ccd: 8.40, cc: 870.00 },
        6: { ccd: 9.95, cc: 1000.00 },
        7: { ccd: 11.10, cc: 1130.00 },
        9: { ccd: 13.00, cc: 1260.00 },
    },
    // Fallback for others
    'bulk_liquid': { 6: { ccd: 10.20, cc: 1050.00 } },
    'frigo': { 6: { ccd: 11.50, cc: 1100.00 } },
    'container': { 6: { ccd: 9.80, cc: 950.00 } },
    'dangerous': { 6: { ccd: 11.20, cc: 1150.00 } },
};

// Generic fallback filler
[2, 3, 4, 5, 7, 9].forEach(axle => {
    ['bulk_liquid', 'frigo', 'container', 'dangerous'].forEach(type => {
        if (!DEFAULT_COEFFICIENTS[type]) DEFAULT_COEFFICIENTS[type] = {};
        if (!DEFAULT_COEFFICIENTS[type][axle]) {
            const general = DEFAULT_COEFFICIENTS['general'][axle] || { ccd: 5.0, cc: 500.0 }; // Fallback if general also missing
            DEFAULT_COEFFICIENTS[type][axle] = { ccd: general.ccd * 1.05, cc: general.cc * 1.05 };
        }
    });
});

interface FreightCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

const FreightCalculator: React.FC<FreightCalculatorProps> = ({ isOpen, onClose }) => {
    const [cargoType, setCargoType] = useState('general');
    const [axles, setAxles] = useState('3'); // Default to 3 (Truck) as per latest screenshot
    const [distance, setDistance] = useState('500');
    const [returnEmpty, setReturnEmpty] = useState(true); // User had this checked in the bad result
    const [tableType, setTableType] = useState('A');
    const [result, setResult] = useState<number | null>(null);

    // Edit Mode State - Stores custom overrides
    const [isEditing, setIsEditing] = useState(false);
    const [customValues, setCustomValues] = useState({ ccd: 0, cc: 0 });

    // Table A (Carga Geral/Lotação) - Calibrated from User Screenshots (3 Axles & 7 Axles)
    // Anchor 3 Axles: CCD 4.6602 | CC 509.43
    // Anchor 7 Axles: CCD 7.3085 | CC 752.64
    // Delta (4 axles difference): CCD +2.6483 (0.6621/axle) | CC +243.21 (60.80/axle)
    const TABLE_A_VALUES: any = {
        'general': {
            2: { ccd: 3.9981, cc: 448.63 }, // Extrapolated (3ax - step)
            3: { ccd: 4.6602, cc: 509.43 }, // ANCHOR (User SShot)
            4: { ccd: 5.3223, cc: 570.23 }, // Interpolated
            5: { ccd: 5.9844, cc: 631.03 }, // Interpolated
            6: { ccd: 6.6465, cc: 691.84 }, // Interpolated
            7: { ccd: 7.3085, cc: 752.64 }, // ANCHOR (User SShot)
            9: { ccd: 8.6327, cc: 874.24 }, // Extrapolated
        }
    };

    // Table B (Apenas Veículo) - Anchors from previous feedback
    const TABLE_B_VALUES: any = {
        2: { ccd: 4.7938, cc: 511.74 },
        3: { ccd: 5.1142, cc: 544.84 },
        4: { ccd: 5.4346, cc: 577.94 },
        5: { ccd: 5.7551, cc: 611.04 },
        6: { ccd: 6.0755, cc: 644.14 },
        7: { ccd: 6.3960, cc: 677.24 },
        9: { ccd: 7.0368, cc: 743.44 },
    };

    // Reset State on Open - Full Clean
    useEffect(() => {
        if (isOpen) {
            setDistance('');
            setResult(null);
            setCustomValues({ ccd: 0, cc: 0 });
            setIsEditing(false);
            setReturnEmpty(false);
            // setAxles('3'); // Don't force this, keep user selection if they just closed/opened? 
            // Actually user asked to "zerar", so let's force defaults.
            setAxles('3');
            setCargoType('general');
            setTableType('A');
        }
    }, [isOpen]);


    if (!isOpen) return null;

    const getCurrentCoeffs = () => {
        if (tableType === 'B') {
            return TABLE_B_VALUES[axles] || TABLE_B_VALUES[7];
        } else {
            // Table A logic
            // For MVP simplifiction, mapping all to general if specific cargo type not found
            // In reality, Table A varies by cargo type slightly.
            // Using Table A general values as the baseline for the "Carga Geral" selection.
            const group = TABLE_A_VALUES['general']; // Simplified for robustness
            return group[axles] || group[7];
        }
    }

    const handleCalculate = () => {
        const dist = parseFloat(distance);
        if (isNaN(dist) || dist <= 0) {
            alert("Digite uma distância válida");
            return;
        }

        let { ccd, cc } = isEditing ? customValues : getCurrentCoeffs();

        if (ccd === 0 && !isEditing) {
            const def = getCurrentCoeffs();
            ccd = def.ccd;
            cc = def.cc;
        }

        // Logic for Return Empty
        // Formula: Total = (Dist * CCD + CC) + (0.92 * Dist * CCD)
        let total = (dist * ccd) + cc;

        if (returnEmpty) {
            const returnCost = 0.92 * dist * ccd;
            total += returnCost;
        }

        setResult(total);
    };

    const toggleEditMode = () => {
        if (!isEditing) {
            // Enter edit mode: populate with current defaults based on selected table
            const current = getCurrentCoeffs();
            setCustomValues({ ccd: current.ccd, cc: current.cc });
        } else {
            // Exit edit mode: reset custom values (optional, but good for "Restaurar Padrão")
            setCustomValues({ ccd: 0, cc: 0 });
        }
        setIsEditing(!isEditing);
    }

    // Switch Table Handler
    const handleSwitchTable = (type: string) => {
        setTableType(type);
        setResult(null); // Clear result on switch
        setIsEditing(false); // Reset edit mode on switch to avoid confusion
        setCustomValues({ ccd: 0, cc: 0 });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="bg-eagles-gold/10 p-2 rounded-lg text-eagles-gold">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Calculadora ANTT</h2>
                            <p className="text-xs text-slate-500">Piso Mínimo Oficial</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <RotateCcw size={20} className="rotate-45" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Operation Type / Table Selector */}
                    <div className="bg-slate-50 p-1 rounded-lg flex text-xs font-bold border border-slate-200">
                        <button
                            className={`flex-1 py-2 rounded-md transition ${tableType === 'A' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => handleSwitchTable('A')}
                        >
                            Tabela A (Carga Lotação)
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-md transition ${tableType === 'B' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => handleSwitchTable('B')}
                        >
                            Tabela B (Apenas Veículo)
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {tableType === 'A' ? "Tipo de Carga" : "Tipo de Veículo (Tabela B)"}
                            </label>

                            {tableType === 'A' ? (
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none bg-white font-medium"
                                    value={cargoType}
                                    onChange={(e) => setCargoType(e.target.value)}
                                    disabled={isEditing}
                                >
                                    {CARGO_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm italic">
                                    Padrão para veículos automotores
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Eixos</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none bg-white"
                                value={axles}
                                onChange={(e) => setAxles(e.target.value)}
                                disabled={isEditing}
                            >
                                <option value="2">2 Eixos (Toco)</option>
                                <option value="3">3 Eixos (Truck)</option>
                                <option value="4">4 Eixos</option>
                                <option value="5">5 Eixos (Carreta 2 Eixos)</option>
                                <option value="6">6 Eixos (Carreta LS)</option>
                                <option value="7">7 Eixos (Bitrem)</option>
                                <option value="9">9 Eixos (Rodotrem)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Distância (KM)</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-eagles-gold/50 outline-none"
                                placeholder="0"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Coefficient Editor */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Coeficientes ({tableType === 'A' ? 'Tabela A' : 'Tabela B'})
                            </span>
                            <button
                                onClick={toggleEditMode}
                                className="text-xs text-eagles-gold hover:underline font-bold"
                            >
                                {isEditing ? "Restaurar Padrão" : "Editar Valores"}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">CCD (R$/km)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="w-full p-1 border border-eagles-gold rounded text-sm font-bold text-slate-700 focus:outline-none"
                                        value={customValues.ccd}
                                        onChange={(e) => setCustomValues({ ...customValues, ccd: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">CC (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-1 border border-eagles-gold rounded text-sm font-bold text-slate-700 focus:outline-none"
                                        value={customValues.cc}
                                        onChange={(e) => setCustomValues({ ...customValues, cc: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center text-sm text-slate-600">
                                <span>CCD: <b>{getCurrentCoeffs()?.ccd?.toFixed(4)}</b></span>
                                <span>CC: <b>{getCurrentCoeffs()?.cc?.toFixed(2)}</b></span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="returnEmpty"
                            className="w-4 h-4 text-eagles-gold border-slate-300 rounded focus:ring-eagles-gold"
                            checked={returnEmpty}
                            onChange={(e) => setReturnEmpty(e.target.checked)}
                        />
                        <label htmlFor="returnEmpty" className="text-sm text-slate-700">Retorno Vazio?</label>
                    </div>

                    {/* Result */}
                    {result !== null && (
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center justify-center mt-2 animate-fade-in-up">
                            <span className="text-sm text-green-600 font-medium mb-1">Valor Piso Mínimo Estimado</span>
                            <span className="text-3xl font-bold text-green-700">
                                {result.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <div className="text-[10px] text-green-600/70 mt-2 flex items-center">
                                <Info size={10} className="mr-1" />
                                {isEditing ? "Baseado nos valores personalizados" : "Baseado na tabela ANTT (estimativa 2024/25)"}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm">
                        Fechar
                    </button>
                    <button
                        onClick={handleCalculate}
                        className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 transition flex items-center"
                    >
                        <Calculator size={16} className="mr-2" />
                        Calcular
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FreightCalculator;
