import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, CheckCircle2, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useStudentTwin } from '../../context/StudentTwinContext';

interface ProfilePictureUploaderProps {
  currentAvatarUrl?: string;
  studentName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onAvatarChange?: (url: string) => void;
  className?: string;
}

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  currentAvatarUrl,
  studentName = 'Student Scholar',
  size = 'lg',
  onAvatarChange,
  className = '',
}) => {
  const { uploadAvatar, removeAvatar, profile } = useStudentTwin();
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUrl = currentAvatarUrl !== undefined ? currentAvatarUrl : profile.avatarUrl;
  const initials = (studentName || profile.fullName || 'Student')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-20 h-20 text-xl',
    lg: 'w-28 h-28 text-3xl',
    xl: 'w-36 h-36 text-4xl',
  }[size];

  // Helper to compress image in browser using Canvas
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (PNG, JPG, WebP)'));
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        reject(new Error('Image file is too large. Please upload an image under 8MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
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
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for processing'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const dataUrl = await processImageFile(file);
      const res = await uploadAvatar(dataUrl);
      if (res.success) {
        if (onAvatarChange) onAvatarChange(res.avatarUrl);
        setSuccessMsg('Profile picture updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg('Failed to update profile picture.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading profile picture.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      await removeAvatar();
      if (onAvatarChange) onAvatarChange('');
      setSuccessMsg('Profile picture removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Failed to remove photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const dataUrl = await processImageFile(file);
      const res = await uploadAvatar(dataUrl);
      if (res.success) {
        if (onAvatarChange) onAvatarChange(res.avatarUrl);
        setSuccessMsg('Profile picture updated!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing dropped image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-5 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar Display Frame with Drag/Drop & Hover */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsHovered(true);
        }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative ${sizeClasses} rounded-3xl overflow-hidden border-2 cursor-pointer transition-all duration-300 shadow-md group shrink-0 ${
          isHovered
            ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02]'
            : 'border-slate-200 dark:border-white/10'
        } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
        title="Click or drag image to change profile photo"
      >
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={studentName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-3xl transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold tracking-wider select-none">
            {initials || <User className="w-1/2 h-1/2 opacity-80" />}
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-opacity duration-200 ${
            isHovered || isProcessing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isProcessing ? (
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          ) : (
            <>
              <Camera className="w-6 h-6 mb-1 text-white" />
              <span className="text-[10px] font-mono font-bold tracking-tight text-center px-1">
                {activeUrl ? 'Change' : 'Upload'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action Controls & Guidelines */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{activeUrl ? 'Replace Photo' : 'Upload Photo'}</span>
          </button>

          {activeUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-mono font-medium border border-slate-200 dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          PNG, JPG or WebP up to 8MB. Automatically formatted across Dashboard, Resume Builder, and AI Portfolio.
        </p>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-mono pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
