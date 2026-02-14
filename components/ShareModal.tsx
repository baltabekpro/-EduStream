import React, { useState } from 'react';
import { ShareService } from '../lib/api';
import { useToast } from './Toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceTitle: string;
    resourceId?: string;
    resourceType: 'quiz' | 'result';
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, resourceTitle, resourceId, resourceType }) => {
    const { addToast } = useToast();
    const [viewOnly, setViewOnly] = useState(true);
    const [password, setPassword] = useState('');
    const [expiresIn, setExpiresIn] = useState('7d');
    const [generatedLink, setGeneratedLink] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleCreateLink = async () => {
        if (!resourceId) {
            addToast('Сначала сгенерируйте и сохраните тест', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await ShareService.create(resourceId, {
                password: password || undefined,
                viewOnly,
                allowCopy: true,
            });
            setGeneratedLink(result.url);
            addToast('Ссылка для учеников создана', 'success');
        } catch (error: any) {
            addToast(error.message || 'Не удалось создать ссылку', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        addToast('Ссылка скопирована', 'success');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">share</span>
                        Share {resourceType === 'quiz' ? 'Quiz' : 'Result'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {!generatedLink ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400 mb-4">
                            You are sharing <span className="text-white font-bold">"{resourceTitle}"</span>. Configure access settings below.
                        </p>
                        
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-slate-500 transition-colors">
                                <span className="text-sm font-medium text-slate-200">View Only Mode</span>
                                <input 
                                    type="checkbox" 
                                    checked={viewOnly} 
                                    onChange={(e) => setViewOnly(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                                />
                            </label>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Password Protection (Optional)</label>
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Set access password"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Link Expiration</label>
                                <select 
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                                >
                                    <option value="1h">1 Hour</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="never">Never</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateLink}
                            disabled={loading}
                            className="w-full mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : 'Generate Link'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 text-center py-4">
                        <div className="size-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">link</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Link Ready!</h4>
                        
                        <div className="flex gap-2">
                            <input 
                                readOnly 
                                value={generatedLink}
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-slate-400 text-sm"
                            />
                            <button 
                                onClick={handleCopy}
                                className="bg-surface border border-border hover:bg-white/5 text-white px-3 rounded-lg"
                            >
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>
                        
                        <p className="text-xs text-slate-500">
                            Anyone with this link {password ? '(and password)' : ''} can view this resource.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareModal;
