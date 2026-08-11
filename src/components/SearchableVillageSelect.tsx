'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, MapPin } from 'lucide-react';

interface VillageItem {
  id: string;
  name: string;
  province?: string;
  district?: string;
}

interface SearchableVillageSelectProps {
  villages: VillageItem[];
  value: string;
  onChange: (villageName: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableVillageSelect({
  villages,
  value,
  onChange,
  placeholder = 'Select Target Village...',
  required = false,
}: SearchableVillageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVillages = villages.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.province && v.province.toLowerCase().includes(search.toLowerCase())) ||
      (v.district && v.district.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white flex items-center justify-between cursor-pointer hover:border-sky-500/50 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span className={value ? 'font-bold text-white' : 'text-slate-400 font-normal'}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 w-full top-full mt-1 bg-[#141c2f] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden space-y-1 p-2 max-h-72 flex flex-col">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type village name or province..."
              className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-52 space-y-1 pt-1">
            {filteredVillages.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-[11px]">
                No villages match &quot;{search}&quot;.
              </div>
            ) : (
              filteredVillages.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    onChange(v.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between hover:bg-sky-500/20 text-xs transition-colors ${
                    value === v.name ? 'bg-sky-500/10 text-sky-400 font-bold' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-1 overflow-hidden">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span className="font-bold text-white text-xs truncate flex-1" title={v.name}>
                      {v.name}
                    </span>
                    {v.province && (
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-white/5 px-1.5 py-0.5 rounded border border-white/10 flex-shrink-0">
                        {v.province}
                      </span>
                    )}
                  </div>
                  {value === v.name && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 ml-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
