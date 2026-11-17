export interface ProcessedMedia {
  fileName: string;
  mimeType: string;
  base64Data: string;
  previewUrl: string;
  mediaType: 'image' | 'video';
  sizeLabel: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function processMediaFile(file: File): Promise<ProcessedMedia> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    throw new Error('Por favor selecciona una foto o un video válido.');
  }

  if (isVideo) {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('El video es muy pesado (máximo 20 MB para envío rápido).');
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el video seleccionado.'));
      reader.readAsDataURL(file);
    });

    return {
      fileName: file.name || `video_${Date.now()}.mp4`,
      mimeType: file.type || 'video/mp4',
      base64Data: dataUrl,
      previewUrl: dataUrl,
      mediaType: 'video',
      sizeLabel: formatBytes(file.size),
    };
  }

  // Image compression via Canvas (max 1280px, JPEG 0.82) for snappy mobile uploads
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });

  try {
    const compressedUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Imagen dañada o formato no compatible.'));
      img.src = originalDataUrl;
    });

    const approxBytes = Math.round((compressedUrl.length * 3) / 4);
    return {
      fileName: file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : `foto_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      base64Data: compressedUrl,
      previewUrl: compressedUrl,
      mediaType: 'image',
      sizeLabel: formatBytes(approxBytes),
    };
  } catch {
    return {
      fileName: file.name || `foto_${Date.now()}.jpg`,
      mimeType: file.type || 'image/jpeg',
      base64Data: originalDataUrl,
      previewUrl: originalDataUrl,
      mediaType: 'image',
      sizeLabel: formatBytes(file.size),
    };
  }
}

export function formatReportTime(isoString?: string, fallback?: string): string {
  if (!isoString) return fallback || 'Reciente';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return fallback || 'Reciente';

  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  const clock = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (diffMin < 1) return `Ahora · ${clock}`;
  if (diffMin < 60) return `Hace ${diffMin} min · ${clock}`;
  const diffHours = Math.floor(diffMin / 60);
  return `Hace ${diffHours} h · ${clock}`;
}
