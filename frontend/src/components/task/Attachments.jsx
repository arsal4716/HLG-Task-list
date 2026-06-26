import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiImage, FiVideo, FiTrash2 } from 'react-icons/fi';
import { taskService } from '../../services/index.js';
import { fileUrl } from '../../utils/format.js';
import { errMessage } from '../../lib/axios.js';

const iconFor = (type = '') => {
  if (type.startsWith('image')) return FiImage;
  if (type.startsWith('video')) return FiVideo;
  return FiFile;
};

export const Attachments = ({ task, canEdit }) => {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task', task._id] });

  const upload = useMutation({
    mutationFn: (formData) => taskService.uploadAttachments(task._id, formData),
    onSuccess: () => {
      toast.success('Uploaded');
      invalidate();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (attId) => taskService.removeAttachment(task._id, attId),
    onSuccess: invalidate,
  });

  const onFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    upload.mutate(fd);
  };

  const attachments = task.attachments || [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Attachments ({attachments.length})</h3>
        {canEdit && (
          <button className="btn-secondary py-1" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            <FiUploadCloud className="h-4 w-4" /> {upload.isPending ? 'Uploading…' : 'Upload'}
          </button>
        )}
        <input ref={fileRef} type="file" multiple hidden onChange={onFiles} />
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400">No files attached.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((a) => {
            const Icon = iconFor(a.fileType);
            return (
              <li key={a._id} className="group flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 dark:border-gray-800">
                <Icon className="h-5 w-5 shrink-0 text-brand-500" />
                <a href={fileUrl(a.url)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm hover:text-brand-600">
                  {a.fileName}
                </a>
                <span className="shrink-0 text-xs text-gray-400">{Math.round((a.size || 0) / 1024)}KB</span>
                {canEdit && (
                  <button onClick={() => remove.mutate(a._id)} className="text-gray-300 hover:text-red-500">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Attachments;
