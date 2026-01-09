import React, { useState } from 'react';
import { Search, Plus, Filter, FileText, ExternalLink } from 'lucide-react';
import externalLinks from '../data/externalLinks.json';
import { useAuth } from '../context/AuthContext';

const Quotations = () => {
    const { hasPermission } = useAuth();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cotações</h1>
                    <p className="text-slate-500">Gestão de orçamentos e calculadoras</p>
                </div>
                {hasPermission('create_quotation') && (
                    <button className="premium-btn flex items-center space-x-2">
                        <Plus size={18} />
                        <span>Nova Cotação</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-8 text-center">
                <div className="max-w-md mx-auto">
                    <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo de Cotação</h3>
                    <p className="text-slate-500 mb-8">
                        Utilize as calculadoras integradas para obter o melhor preço.
                        O sistema de cotação automática interna será implementado em breve.
                    </p>

                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ferramentas Externas</p>
                        {externalLinks.map(link => (
                            <a
                                key={link.title}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 flex items-center justify-between group transition"
                            >
                                <span className="font-semibold text-slate-700">{link.title}</span>
                                <ExternalLink size={18} className="text-slate-400 group-hover:text-eagles-gold" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Quotations;
