
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { X, Copy, Check, Smartphone, AlertTriangle } from 'lucide-react';
import { SyncData } from '../types';

interface SyncModalProps {
  data: SyncData;
  onClose: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ data, onClose }) => {
  const [url, setUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const json = JSON.stringify(data);
      
      // Safe base64 encoding for UTF-8
      const base64 = window.btoa(unescape(encodeURIComponent(json)));
      
      // Build the complete share URL
      const shareUrl = `${window.location.origin}${window.location.pathname}?data=${base64}`;
      
      console.log('Share URL to encode:', shareUrl);
      console.log('Share URL length:', shareUrl.length);
      
      // Set the URL for the input field
      setUrl(shareUrl);

      if (shareUrl.length > 8000) {
        setError("Data is too large to sync via QR Code. Try clearing some history.");
        return;
      }
    } catch (e) {
      console.error('URL encoding error:', e);
      setError("Failed to encode data.");
    }
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Sync Device</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          <p className="text-slate-400 text-center text-sm">
            Scan this QR code with another device to transfer your timers and history.
          </p>

          <div className="bg-white p-4 rounded-xl shadow-lg">
            {error ? (
               <div className="w-[250px] h-[250px] flex flex-col items-center justify-center text-red-500 gap-2">
                 <AlertTriangle size={32} />
                 <span className="text-center text-xs text-slate-900 font-medium">{error}</span>
               </div>
            ) : url ? (
              <QRCode
                value={url}
                size={250}
                level="L"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>

          <div className="w-full space-y-2">
             <label className="text-xs text-slate-500 uppercase font-semibold pl-1">Share Link</label>
             <div className="flex gap-2">
                <input 
                  readOnly
                  value={url} 
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
                  title="Copy Link"
                >
                   {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SyncModal;
