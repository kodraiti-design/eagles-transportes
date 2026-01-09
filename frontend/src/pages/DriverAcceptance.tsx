import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Truck, CheckCircle, XCircle, Camera, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '../utils/api';

interface Freight {
    id: number;
    origin: string;
    destination: string;
    pickup_date: string;
    delivery_date: string;
    status: 'QUOTED' | 'RECRUITING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED';
    valor_motorista: number;
    rejection_reason?: string;
    driver?: {
        name: string;
    }
}

const DriverAcceptance = () => {
    const { freightId } = useParams();
    const [freight, setFreight] = useState<Freight | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Actions State
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Delivery State
    const [showUpload, setShowUpload] = useState(false);
    const [photos, setPhotos] = useState<FileList | null>(null);

    const fetchFreight = async () => {
        try {
            const response = await axios.get(`${API_URL}/freights/${freightId}`);
            setFreight(response.data);
        } catch (err) {
            setError("Frete não encontrado ou expirado.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (freightId) fetchFreight();
    }, [freightId]);

    const handleAccept = async () => {
        if (!confirm("Confirmar o aceite deste frete?")) return;
        setActionLoading(true);
        try {
            await axios.post(`${API_URL}/freights/${freightId}/accept`);
            await fetchFreight();
            alert("Frete aceito com sucesso! Boa viagem.");
        } catch (err) {
            alert("Erro ao aceitar frete.");
        } finally {
            setActionLoading(false);
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert("Por favor, informe o motivo da recusa.");
            return;
        }
        setActionLoading(true);
        try {
            await axios.post(`${API_URL}/freights/${freightId}/reject`, { reason: rejectReason });
            await fetchFreight();
            setShowRejectInput(false);
        } catch (err) {
            alert("Erro ao recusar frete.");
        } finally {
            setActionLoading(false);
        }
    }

    const handleStartTransit = async () => {
        setActionLoading(true);
        try {
            await axios.patch(`${API_URL}/freights/${freightId}/status?status=IN_TRANSIT`);
            await fetchFreight();
            alert("Coleta confirmada! Boa viagem.");
        } catch (err) {
            console.error(err);
            alert("Erro ao confirmar coleta.");
        } finally {
            setActionLoading(false);
        }
    }

    const handleDeliver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!photos || photos.length < 3) {
            alert("É necessário enviar pelo menos 3 fotos (Comprovante, Carga, Local, etc.) para finalizar.");
            return;
        }

        setActionLoading(true);
        const formData = new FormData();
        Array.from(photos).forEach(file => {
            formData.append("files", file);
        });

        try {
            await axios.post(`${API_URL}/freights/${freightId}/deliver`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await fetchFreight();
            setShowUpload(false);
            alert("Entrega finalizada com sucesso! As fotos foram enviadas.");
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar fotos. Tente novamente.");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50">Carregando...</div>;
    if (error || !freight) return <div className="flex h-screen items-center justify-center bg-slate-50 text-red-500">{error}</div>;

    const isPending = freight.status === 'RECRUITING' || freight.status === 'QUOTED';
    const isAccepted = freight.status === 'ASSIGNED' || freight.status === 'IN_TRANSIT';
    const isDelivered = freight.status === 'DELIVERED';
    const isRejected = freight.status === 'REJECTED';

    return (
        <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden pb-6">
                <div className="bg-eagles-dark p-6 text-center">
                    <h1 className="text-xl font-bold text-eagles-gold">EAGLES TRANSPORTES</h1>
                    <p className="text-slate-400 text-sm">Portal do Motorista</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Banner */}
                    <div className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                            ${isPending ? 'bg-blue-100 text-blue-700' : ''}
                            ${isAccepted ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${isDelivered ? 'bg-green-100 text-green-700' : ''}
                            ${isRejected ? 'bg-red-100 text-red-700' : ''}
                        `}>
                            {isPending && "Nova Oferta"}
                            {isAccepted && "Em Andamento"}
                            {isDelivered && "Finalizado"}
                            {isRejected && "Recusado"}
                        </span>

                        <div className="mt-4 text-3xl font-bold text-slate-800">
                            R$ {freight.valor_motorista}
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                        <div className="flex items-start space-x-3">
                            <MapPin className="text-eagles-gold mt-1 flex-shrink-0" size={18} />
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 uppercase">Coleta</p>
                                <p className="font-bold text-slate-700">{freight.origin}</p>
                                <p className="text-slate-500">{format(new Date(freight.pickup_date), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <MapPin className="text-slate-400 mt-1 flex-shrink-0" size={18} />
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 uppercase">Entrega</p>
                                <p className="font-bold text-slate-700">{freight.destination}</p>
                                <p className="text-slate-500">{format(new Date(freight.delivery_date), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div className="space-y-3 pt-2">

                        {/* PENDING STATE ACTIONS */}
                        {isPending && !showRejectInput && (
                            <>
                                <button
                                    onClick={handleAccept}
                                    disabled={actionLoading}
                                    className="w-full bg-gradient-to-r from-eagles-gold to-yellow-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                                >
                                    {actionLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Truck size={20} />}
                                    <span>ACEITAR FRETE</span>
                                </button>
                                <button
                                    onClick={() => setShowRejectInput(true)}
                                    disabled={actionLoading}
                                    className="w-full bg-white border border-red-200 text-red-500 font-bold py-3 rounded-xl hover:bg-red-50 transition flex items-center justify-center space-x-2"
                                >
                                    <XCircle size={20} />
                                    <span>Recusar Oferta</span>
                                </button>
                            </>
                        )}

                        {/* REJECT INPUT */}
                        {isPending && showRejectInput && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                                <label className="block text-sm font-bold text-red-700 mb-2">Motivo da Recusa:</label>
                                <textarea
                                    className="w-full p-2 rounded border border-red-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                    rows={3}
                                    placeholder="Ex: Valor baixo, data indisponível..."
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowRejectInput(false)}
                                        className="flex-1 py-2 text-slate-500 bg-white rounded border border-slate-200 font-medium text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 text-white bg-red-500 rounded font-medium text-xs hover:bg-red-600"
                                    >
                                        {actionLoading ? 'Enviando...' : 'Confirmar Recusa'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ACCEPTED STATE ACTIONS (TRANSIT/DELIVER) */}
                        {freight.status === 'ASSIGNED' && (
                            <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                                <h3 className="text-amber-800 font-bold flex items-center justify-center mb-1">
                                    <Truck size={18} className="mr-2" />
                                    Aguardando Coleta
                                </h3>
                                <p className="text-xs text-amber-700 mb-4 px-2">
                                    Chegou no local de retirada? Clique abaixo para avisar.
                                </p>
                                <button
                                    onClick={handleStartTransit}
                                    disabled={actionLoading}
                                    className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition flex items-center justify-center space-x-2 shadow-md"
                                >
                                    {actionLoading ? (
                                        "Enviando..."
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            <span>CONFIRMAR COLETA</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {freight.status === 'IN_TRANSIT' && !showUpload && (
                            <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                                <h3 className="text-blue-800 font-bold flex items-center justify-center mb-1">
                                    <Truck size={18} className="mr-2" />
                                    Em Trânsito
                                </h3>
                                <p className="text-xs text-blue-600 mb-4 px-2">
                                    Quando chegar ao destino e descarregar, clique abaixo para enviar os comprovantes.
                                </p>
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 shadow-md"
                                >
                                    <Camera size={20} />
                                    <span>FINALIZAR ENTREGA</span>
                                </button>
                            </div>
                        )}

                        {/* UPLOAD FORM */}
                        {isAccepted && showUpload && (
                            <form onSubmit={handleDeliver} className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="font-bold text-slate-700 mb-2 flex items-center">
                                    <Camera size={18} className="mr-2 text-eagles-gold" />
                                    Comprovantes de Entrega
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Tire fotos do canhoto assinado, da carga descarregada e do local.
                                    <span className="font-bold text-red-500 ml-1">Mínimo 3 fotos.</span>
                                </p>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setPhotos(e.target.files)}
                                    className="w-full p-2 border border-slate-300 rounded bg-white text-sm mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-eagles-gold file:text-white hover:file:bg-yellow-600"
                                />

                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpload(false)}
                                        className="flex-1 py-2 text-slate-500 bg-white rounded border border-slate-200 font-medium text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 py-2 text-white bg-green-600 rounded font-medium text-xs hover:bg-green-700 flex items-center justify-center shadow-sm"
                                    >
                                        {actionLoading ? (
                                            'Enviando...'
                                        ) : (
                                            <>
                                                <Upload size={14} className="mr-1" />
                                                Enviar e Finalizar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* FINISHED STATES */}
                        {isDelivered && (
                            <div className="bg-green-50 text-green-800 p-6 rounded-xl text-center font-bold flex flex-col items-center animate-in zoom-in border border-green-100">
                                <div className="bg-green-100 p-3 rounded-full mb-3">
                                    <CheckCircle size={32} className="text-green-600" />
                                </div>
                                <span className="text-lg">Entrega Realizada!</span>
                                <p className="text-xs font-normal mt-2 opacity-80">
                                    Obrigado pelo serviço. O pagamento será processado conforme combinado.
                                </p>
                            </div>
                        )}

                        {isRejected && (
                            <div className="bg-red-50 text-red-800 p-6 rounded-xl text-center flex flex-col items-center animate-in zoom-in border border-red-100">
                                <XCircle size={32} className="text-red-500 mb-2" />
                                <span className="font-bold">Oferta Recusada</span>
                                <p className="text-xs mt-1 italic">"{freight.rejection_reason || 'Sem motivo informado'}"</p>
                            </div>
                        )}

                    </div>

                    <p className="text-center text-[10px] text-slate-400">
                        Ao aceitar, você concorda com os termos de transporte da Eagles Transportes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DriverAcceptance;
