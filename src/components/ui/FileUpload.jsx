import { useCallback, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function FileUpload({
  label,
  accept,
  onChange,
  preview = false,
  name,
  error,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      setFileName(file.name);

      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
      }

      // Simulate an event-like object for the parent handler
      onChange?.({ target: { name, files: [file], value: file } });
    },
    [onChange, preview, name],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const clearFile = () => {
    setPreviewUrl(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
    onChange?.({ target: { name, files: [], value: null } });
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/80">{label}</label>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          min-h-[140px] rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-[#e94560]/60 bg-[#e94560]/5'
            : error
              ? 'border-red-500/40 bg-white/[0.02]'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative p-3">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-28 rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-full bg-white/5">
              <Upload className="w-6 h-6 text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/60">
                <span className="text-[#e94560] font-medium">Click to upload</span> or drag and drop
              </p>
              {accept && (
                <p className="text-xs text-white/30 mt-1">{accept}</p>
              )}
            </div>
          </>
        )}

        {fileName && !previewUrl && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <span className="text-xs text-white/60 truncate max-w-[200px]">{fileName}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="text-white/30 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
