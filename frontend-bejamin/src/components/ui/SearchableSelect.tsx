import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X, Loader2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  id: number;
  nom: string;
  sousTitre?: string;
  value?: string;
}

function getOptionValue(opt: Option): string {
  return opt.value !== undefined ? opt.value : String(opt.id);
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

let instanceCounter = 0;

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyMessage = 'Aucun résultat',
  loading = false,
  error,
  className,
  triggerClassName,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownUp, setDropdownUp] = useState(false);
  const [maxHeight, setMaxHeight] = useState(240);
  const [pos, setPos] = useState({ top: 0, bottom: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const instanceId = useRef(`ss_${++instanceCounter}`);

  const selected = options.find(o => getOptionValue(o) === value);

  const filtered = search.trim()
    ? options.filter(o =>
        o.nom.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos({ top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width });

    const searchBarHeight = 44;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= searchBarHeight + gap + 40) {
      setDropdownUp(false);
      setMaxHeight(Math.min(spaceBelow - searchBarHeight - gap, 240));
    } else if (spaceAbove >= searchBarHeight + gap + 40) {
      setDropdownUp(true);
      setMaxHeight(Math.min(spaceAbove - searchBarHeight - gap, 240));
    } else {
      setDropdownUp(false);
      setMaxHeight(Math.min(Math.max(spaceBelow - searchBarHeight - gap, 100), 240));
    }
  }, [filtered.length]);

  const toggleOpen = () => {
    if (disabled) return;
    const next = !open;
    if (next) {
      updatePosition();
    }
    setOpen(next);
    if (!next) setSearch('');
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      document.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [open, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current || containerRef.current.contains(e.target as Node)) return;
      const target = e.target as Node;
      const portalDropdown = document.getElementById(instanceId.current);
      if (portalDropdown && portalDropdown.contains(target)) return;
      setOpen(false);
      setSearch('');
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (opt: Option) => {
    onValueChange(getOptionValue(opt));
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        onClick={toggleOpen}
        className={cn(
          'flex items-center gap-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 cursor-pointer transition-colors',
          triggerClassName,
          error && 'border-red-400',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'border-royal-500 ring-1 ring-royal-500'
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin text-gray-400" />
        ) : (
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
        )}
        <span className={cn('flex-1 truncate', !selected && 'text-gray-400')}>
          {selected ? selected.nom : placeholder}
        </span>
        {value ? (
          <button onClick={handleClear} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className={cn('w-4 h-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && createPortal(
        <div id={instanceId.current}
          style={{
            position: 'fixed',
            top: dropdownUp ? pos.top - maxHeight - 48 : pos.bottom + 4,
            left: pos.left,
            width: pos.width,
            zIndex: 99999,
          }}
          className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden animate-in fade-in duration-150"
        >
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-1 focus:ring-royal-500 outline-none"
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-400">{emptyMessage}</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                    getOptionValue(opt) === value
                      ? 'bg-royal-50 text-royal-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className="flex-1 truncate">{opt.nom}</span>
                  {opt.sousTitre && <span className="text-xs text-gray-400 shrink-0">{opt.sousTitre}</span>}
                  {getOptionValue(opt) === value && <Check className="w-4 h-4 shrink-0 text-royal-600" />}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}