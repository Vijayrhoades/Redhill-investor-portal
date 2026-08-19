import React from 'react';
import { X, Mail, CheckCircle2, User, Building2, Calendar, ExternalLink } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  recipientName: string;
  recipientEmail: string;
  projectName?: string;
  milestoneName?: string;
  htmlContent: string;
  sentAt?: string;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  subject,
  recipientName,
  recipientEmail,
  projectName,
  milestoneName,
  htmlContent,
  sentAt,
}: EmailPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-[#13171F] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden z-10 text-white animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-redhill-gray to-[#161a22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-redhill-red/10 border border-red-500/20 flex items-center justify-center text-redhill-red">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                Automated Email Message
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Dispatched
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Exact HTML email sent to targeted project investor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata Header */}
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.06] text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-semibold w-16">Subject:</span>
              <span className="font-bold text-white text-sm">{subject}</span>
            </div>
            {sentAt && (
              <div className="text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(sentAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-semibold w-16">Recipient:</span>
              <span className="text-gray-200 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <User className="w-3 h-3 text-redhill-red" />
                <strong className="text-white">{recipientName}</strong> &lt;{recipientEmail}&gt;
              </span>
            </div>
            {projectName && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Project: <strong className="text-white">{projectName}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Rendered HTML Email Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0c0f] flex justify-center">
          <div className="w-full max-w-[620px] bg-[#171a21] rounded-xl overflow-hidden border border-white/10 shadow-lg">
            <iframe
              srcDoc={htmlContent}
              title="Email Preview"
              className="w-full min-h-[640px] border-0"
              sandbox="allow-same-origin allow-popups"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-redhill-gray flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Automated messaging engine powered by Redhill Infra
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
