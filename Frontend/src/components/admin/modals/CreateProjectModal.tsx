import React, { useState, useRef } from 'react';
import { Building2, X, Upload, Link as LinkIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    location: string;
    totalValue: string;
    status: string;
    imageUrl: string;
    completionPercentage: number;
    cctvUrl: string;
    imageFile: File | null;
  }) => Promise<void>;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [status, setStatus] = useState('Construction');
  const [imageUrl, setImageUrl] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [cctvUrl, setCctvUrl] = useState('');
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        location,
        totalValue,
        status,
        imageUrl,
        completionPercentage,
        cctvUrl,
        imageFile: imageUploadType === 'file' ? imageFile : null
      });
      setName('');
      setLocation('');
      setTotalValue('');
      setImageUrl('');
      setCctvUrl('');
      setImageFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
            <Building2 className="w-6 h-6 text-redhill-red" />
            Create New Project
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
              placeholder="e.g. Redhill Heights"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
              placeholder="e.g. Bangalore, KA"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Total Value</label>
              <input
                type="text"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                placeholder="e.g. ₹150 Cr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
              >
                <option value="Planning" className="bg-redhill-gray">Planning</option>
                <option value="Approval" className="bg-redhill-gray">Approval</option>
                <option value="Construction" className="bg-redhill-gray">Construction</option>
                <option value="Completed" className="bg-redhill-gray">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-gray-400">Cover Image</label>
              <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setImageUploadType('url')}
                  className={cn("px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all", imageUploadType === 'url' ? "bg-redhill-red text-white" : "text-gray-400 hover:text-white")}
                >
                  <LinkIcon className="w-3 h-3" /> URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadType('file')}
                  className={cn("px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all", imageUploadType === 'file' ? "bg-redhill-red text-white" : "text-gray-400 hover:text-white")}
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
              </div>
            </div>

            {imageUploadType === 'url' ? (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
                placeholder="https://images.unsplash.com/..."
              />
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/[0.1] hover:border-redhill-red/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.03]"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                  accept="image/*" 
                  className="hidden" 
                />
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-300 font-medium">
                  {imageFile ? imageFile.name : "Click to browse cover photo"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">CCTV Stream URL (Optional)</label>
            <input
              type="url"
              value={cctvUrl}
              onChange={(e) => setCctvUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
              placeholder="https://... live stream or video link"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl font-bold transition-all text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-redhill-red hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-redhill-red/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
