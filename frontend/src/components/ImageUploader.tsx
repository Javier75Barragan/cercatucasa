import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { commonApi } from '../services/api';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  initialImage?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

const ImageUploader = ({ onUploadSuccess, label = 'Subir Imagen', initialImage, aspectRatio = 'square' }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview inmediata
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subida real
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await commonApi.uploadImage(formData);

      if (response.data.success) {
        onUploadSuccess(response.data.data.url);
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen. Intenta de nuevo.');
      setPreview(initialImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">{label}</label>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-[24px] border-2 border-dashed border-white/10 hover:border-primary-500/50 transition-all bg-white/5 ${aspectClasses[aspectRatio]} flex items-center justify-center`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="text-white w-8 h-8" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary-500/10 transition-colors">
              <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-primary-400 transition-colors" />
            </div>
            <span className="text-xs text-white/30 font-medium group-hover:text-white/60 transition-colors">JPG, PNG o WEBP</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Subiendo...</span>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default ImageUploader;
