import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 4,
  label = 'Farmland Photos',
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // High-res presets for farmland demonstration
  const sampleFarmlands = [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1000&q=80',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newImages: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      // Compress using canvas to keep Firestore document size small and crisp
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Get compressed jpeg data url
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          newImages.push(dataUrl);
          processed++;

          if (processed === files.length) {
            const combined = [...images, ...newImages].slice(0, maxImages);
            onChange(combined);
            setIsProcessing(false);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length < maxImages) {
      onChange([...images, urlInput.trim()]);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-emerald-950">
          {label} <span className="text-xs text-emerald-700 font-normal">({images.length}/{maxImages})</span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 transition"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          {showUrlInput ? 'Hide URL link' : 'Add image by URL'}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste public photo URL (e.g. https://...)"
            className="flex-1 text-sm border border-emerald-300 rounded-lg px-3 py-2 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Add
          </button>
        </div>
      )}

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-video rounded-xl overflow-hidden border border-emerald-200 shadow-sm group bg-emerald-950/5"
          >
            <img src={img} alt={`Land photo ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition shadow"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 bg-emerald-800/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                Cover Photo
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-xl aspect-video flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-emerald-50/40 hover:bg-emerald-50/90 transition group">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
            <Upload className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition mb-1" />
            <span className="text-xs font-semibold text-emerald-900">
              {isProcessing ? 'Optimizing...' : 'Upload Photo'}
            </span>
            <span className="text-[10px] text-emerald-600">JPG, PNG, WEBP</span>
          </label>
        )}
      </div>

      {images.length === 0 && (
        <div className="pt-1">
          <p className="text-xs text-emerald-700 mb-1.5">Or choose a sample fertile farmland photo:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sampleFarmlands.slice(0, 3).map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange([sample])}
                className="flex items-center gap-1.5 text-xs bg-emerald-100/70 hover:bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300 transition"
              >
                <ImageIcon className="w-3 h-3 text-emerald-700" />
                Sample Farm {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
