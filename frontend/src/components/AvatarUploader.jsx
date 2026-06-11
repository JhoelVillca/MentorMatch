import React, { useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';

const AvatarUploader = ({ role, currentAvatar, onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const basePath = role === 'mentor' ? '/api/profiles/mentor/me' : '/api/profiles/mentee/me';

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      setError('La imagen pesa demasiado. El limite es 5MB.');
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(extension)) {
      setError('Formato no valido. Usa JPG, PNG o WEBP.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const handshakeRes = await apiClient(`${basePath}/upload-url?ext=${extension}`, { method: 'GET' });
      
      const { upload_url, fields, object_key } = handshakeRes;

      let s3Res;
      
      if (fields && Object.keys(fields).length > 0) {
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append('file', file);

        s3Res = await fetch(upload_url, {
          method: 'POST',
          body: formData,
        });
      } else {
        s3Res = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file,
        });
      }

      if (!s3Res.ok && s3Res.status !== 204) {
        throw new Error('Fallo al subir el archivo a la nube');
      }

      const finalImageUrl = `${upload_url}/${object_key}`; 

      await apiClient(`${basePath}/foto`, {
        method: 'PATCH',
        body: { foto_url: finalImageUrl }
      });

      onUploadSuccess(`${finalImageUrl}?t=${new Date().getTime()}`);

    } catch (err) {
      console.error("Error en el flujo de subida:", err);
      setError(err.message || "Error al subir la imagen");
    } finally {
      setIsUploading(false);
      event.target.value = null; 
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        onClick={handleClick}
        className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative group
          ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500'}
        `}
      >
        {currentAvatar ? (
          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm text-center">Subir<br/>Foto</span>
        )}
        
        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-bold">Cambiar</span>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/jpeg, image/png, image/webp"
        className="hidden" 
      />

      {isUploading && <p className="text-xs text-blue-500 font-semibold">Subiendo a la nube...</p>}
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
};

export default AvatarUploader;
