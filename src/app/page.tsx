"use client";

import { useState, useRef, ChangeEvent, Fragment, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { UploadIcon, LoaderIcon, BrainCircuitIcon, PlusIcon, EditIcon, TrashIcon, DownloadIcon } from "@/components/icons";

// --- DATA MODEL ---
interface ManifestData {
  id?: number;
  createdAt?: string;
  fecha?: string;
  folio?: string;
  numeroVuelo?: string;
  matricula?: string;
  [key: string]: any;
}

// --- SCANNER & PARSER (inside a modal) ---
const ScannerModal = ({ isOpen, onClose, onSaveSuccess }: { isOpen: boolean; onClose: () => void; onSaveSuccess: () => void; }) => {
  if (!isOpen) return null;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<ManifestData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseOcrText = (text: string): Partial<ManifestData> => {
      const extract = (regex: RegExp) => text.match(regex)?.[1]?.trim() || undefined;
      const data: Partial<ManifestData> = {
        fecha: extract(/FECHA\s*[:]?\s*(\d{2}\/\d{2}\/\d{4})/i),
        numeroVuelo: extract(/(?:VUELO|FLIGHT|FLT\s*N?O?)\s*[:]?\s*([A-Z0-9]+)/i),
        matricula: extract(/(?:MATR[IÍ]CULA|REG|REGISTRATION|MATRICULA)\s*[:]?\s*([A-Z0-9-]+)/i),
        equipo: extract(/(?:EQUIPO|AIRCRAFT|ACFT)\s*[:]?\s*([A-Z0-9\s-]+?)(?:\s{2,}|$)/i),
        pilotoAlMando: extract(/(?:PILOTO AL MANDO|PIC|CAPITAN|CAPTAIN)\s*[:]?\s*([A-Za-z\s\.]+?)(?:\s{2,}|$)/i),
        observaciones: text.match(/OBSERVACIONES\n((?:.|\n)*?)TRANSPORTISTA/i)?.[1]?.trim(),
        rawText: text,
      };
      data.folio = `AIFA-${String(Date.now()).slice(-6)}`;
      return data;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
      setError(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      const parsedData = parseOcrText(text);
      setExtractedData(parsedData);
      await worker.terminate();
    } catch (err) { setError("Error en OCR."); console.error(err); } 
    finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!extractedData) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData),
      });
      if (!response.ok) throw new Error('Failed to save');
      onSaveSuccess();
      handleClose();
    } catch (err) { setError("Error al guardar."); console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleClose = () => {
      setFile(null);
      setPreviewUrl(null);
      setExtractedData(null);
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-white mb-4">Digitalizar Nuevo Manifiesto</h2>
        {!extractedData && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-12">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    <UploadIcon className="h-5 w-5" /> Seleccionar Archivo
                </button>
                {file && <p className="text-sm text-gray-400 mt-4">{file.name}</p>}
                {file && <button onClick={handleScan} disabled={isLoading} className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                    {isLoading ? <><LoaderIcon className="animate-spin h-5 w-5" />Analizando...</> : <><BrainCircuitIcon className="h-5 w-5" />Analizar Manifiesto</>}</button>}
            </div>
        )}
        {extractedData && (
            <div>
                <h3 className="text-xl text-white mb-2">Resultados del Escaneo (Editable)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {Object.keys(extractedData).map(key => {
                        if (key === 'rawText') return null;
                        return (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="text" value={extractedData[key] || ''} onChange={e => setExtractedData({...extractedData, [key]: e.target.value})} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                            </div>
                        )
                    })}
                </div>
                <textarea readOnly value={extractedData.rawText || ''} className="w-full bg-gray-900 text-gray-300 h-24 p-2 rounded" />
            </div>
        )}
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={handleClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button onClick={handleSave} disabled={!extractedData || isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                {isLoading ? 'Guardando...' : 'Guardar Manifiesto'}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD PAGE ---
export default function SGMPage() {
  const [manifests, setManifests] = useState<ManifestData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchManifests = async () => {
    try {
      const response = await fetch('/api/manifests');
      const data = await response.json();
      setManifests(data);
    } catch (error) {
      console.error("Failed to fetch manifests", error);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard de Manifiestos</h1>
            <p className="text-lg text-gray-400">Total de registros: {manifests.length}</p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <button onClick={() => window.location.href='/api/export'} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <DownloadIcon className="h-5 w-5" />
                Exportar a Excel
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="h-5 w-5" />
                Nuevo Manifiesto
            </button>
          </div>
        </header>

        <main className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-xs text-indigo-200 uppercase">
                        <tr>
                            <th className="p-3">Folio</th>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Vuelo</th>
                            <th className="p-3">Matrícula</th>
                            <th className="p-3">Origen</th>
                            <th className="p-3">Destino</th>
                            <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {manifests.map((m) => (
                            <tr key={m.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-mono text-sm">{m.folio}</td>
                                <td className="p-3">{m.fecha}</td>
                                <td className="p-3">{m.numeroVuelo}</td>
                                <td className="p-3">{m.matricula}</td>
                                <td className="p-3">{m.origenVuelo}</td>
                                <td className="p-3">{m.destinoFinal}</td>
                                <td className="p-3 text-center flex justify-center gap-2">
                                    <button className="text-gray-400 hover:text-white"><EditIcon className="h-5 w-5" /></button>
                                    <button className="text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
      </div>
      <ScannerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={fetchManifests} />
    </div>
  );
}


