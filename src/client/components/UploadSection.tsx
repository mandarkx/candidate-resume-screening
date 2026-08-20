import { useCallback, type DragEvent, type ChangeEvent } from 'react';

interface UploadSectionProps {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
}

export default function UploadSection({ accept, multiple, onFiles }: UploadSectionProps) {
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files) as File[];
      onFiles(multiple ? dropped : dropped.slice(0, 1));
    },
    [multiple, onFiles]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []) as File[];
      onFiles(multiple ? selected : selected.slice(0, 1));
    },
    [multiple, onFiles]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="upload-zone" onDrop={handleDrop} onDragOver={handleDragOver}>
      <input
        id="file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
      <label htmlFor="file-input" className="upload-label">
        <strong>Drag & drop</strong> or click to upload
      </label>
      <p className="upload-hint">Supported: PDF, DOCX</p>
    </div>
  );
}
