import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as emailApi from '../../services/emailApi';

export default function AttachmentUploader({ attachments, onUpload }) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsUploading(true);
    try {
      const uploadPromises = acceptedFiles.map(file => emailApi.uploadAttachment(file));
      const uploadedKeys = await Promise.all(uploadPromises);
      onUpload([...attachments, ...uploadedKeys]);
    } catch (error) {
      console.error("Upload failed:", error);
      // Show an error toast to the user
    } finally {
      setIsUploading(false);
    }
  }, [attachments, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`p-4 border-2 border-dashed rounded-md text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}
      >
        <input {...getInputProps()} />
        <p>Drag & drop files here, or click to select files</p>
        {isUploading && <p className="text-sm text-blue-500">Uploading...</p>}
      </div>
      <aside className="mt-2">
        <h4 className="font-semibold">Attachments:</h4>
        <ul>
          {attachments.map((key, i) => (
            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{key.split('/').pop()}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}