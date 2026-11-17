import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Terminal, 
  Sparkles,
  Layers,
  Flame
} from 'lucide-react';
import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES, FlutterFile } from '../data/flutterProjectFiles';

export const FlutterCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_PROJECT_FILES[1]); // main.dart by default
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add each file into the zip
      FLUTTER_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.code);
      });

      // Add a README.md inside the zip
      zip.file(
        'README.md',
        `# MoviRadar - Proyecto Flutter & BLoC (Android / iOS)\n\n` +
        `Este es el código fuente real en Flutter y Dart de MoviRadar con Clean Architecture y BLoC.\n\n` +
        `## Pasos para ejecutar:\n` +
        `1. Instala Flutter SDK (>=3.2.0)\n` +
        `2. En la terminal ejecuta: \`flutter pub get\`\n` +
        `3. Conecta tu celular Android o inicia un emulador.\n` +
        `4. Ejecuta: \`flutter run\`\n\n` +
        `## Firebase & Google Maps:\n` +
        `- Sigue las instrucciones en lib/features/auth/data/repositories/firebase_auth_repository_impl.dart para conectar Firebase.\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'moviradar_flutter_project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar inside Code Viewer */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Arquitectura Flutter & BLoC</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                Dart 3.x
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Código fuente nativo listo para Android Studio, VS Code y compilación APK.
            </p>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Generando ZIP...' : 'Descargar Proyecto Flutter (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Main split: File List Sidebar + Code Editor */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Tree Explorer */}
        <div className="w-full md:w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto max-h-56 md:max-h-full">
          <div className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estructura del Proyecto</span>
            </span>
            <span className="text-slate-500 font-mono tabular-nums">{FLUTTER_PROJECT_FILES.length} archivos</span>
          </div>

          <div className="p-2 space-y-1">
            {FLUTTER_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* Architecture readiness notes */}
          <div className="mt-auto p-4 border-t border-slate-900 bg-slate-900/40 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <Flame className="w-3.5 h-3.5" />
              <span>Preparado para Firebase & Maps</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              `AuthRepository` y `FirebaseAuthRepositoryImpl` dejan listos los métodos para reemplazar sin tocar la interfaz ni el BLoC.
            </p>
          </div>
        </div>

        {/* Right Code Display */}
        <div className="flex-1 flex flex-col bg-[#070b12] overflow-hidden">
          {/* File Header */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">{selectedFile.path}</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  — {selectedFile.description}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Code Content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-[#05080f]">
            <pre className="selection:bg-emerald-500/30 selection:text-white">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
