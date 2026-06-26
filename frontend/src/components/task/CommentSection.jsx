import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiSend, FiPaperclip, FiCode, FiTrash2, FiX } from 'react-icons/fi';
import { commentService } from '../../services/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { fromNow, fileUrl } from '../../utils/format.js';
import { errMessage } from '../../lib/axios.js';
import { ROLES } from '../../utils/constants.js';

export const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.list(taskId),
  });
  const comments = data?.data?.comments || [];

  const add = useMutation({
    mutationFn: (formData) => commentService.add(taskId, formData),
    onSuccess: () => {
      setText('');
      setFiles([]);
      setCodeMode(false);
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => commentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    const fd = new FormData();
    if (codeMode) fd.append('codeBlock', text);
    else fd.append('text', text);
    files.forEach((f) => fd.append('files', f));
    add.mutate(fd);
  };

  return (
    <div>
      <h3 className="mb-4 font-semibold">Comments ({comments.length})</h3>

      <form onSubmit={submit} className="mb-6 space-y-2">
        {codeMode ? (
          <textarea
            className="input min-h-[100px] font-mono text-xs"
            placeholder="Paste code…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <textarea
            className="input min-h-[70px]"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                {f.name}
                <button type="button" onClick={() => setFiles((arr) => arr.filter((_, j) => j !== i))}>
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCodeMode((c) => !c)} className={`btn-ghost p-2 ${codeMode ? 'text-brand-600' : ''}`} title="Code block">
            <FiCode className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost p-2" title="Attach files">
            <FiPaperclip className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files))} />
          <button type="submit" className="btn-primary ml-auto" disabled={add.isPending}>
            <FiSend className="h-4 w-4" /> Send
          </button>
        </div>
      </form>

      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c._id} className="flex gap-3">
            <Avatar user={c.author} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.author?.name}</span>
                <span className="text-xs text-gray-400">{fromNow(c.createdAt)}</span>
                {c.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
                {(c.author?._id === user?._id || user?.role !== ROLES.EMPLOYEE) && (
                  <button onClick={() => remove.mutate(c._id)} className="ml-auto text-gray-400 hover:text-red-500">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {c.text && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{c.text}</p>}
              {c.codeBlock && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                  <code>{c.codeBlock}</code>
                </pre>
              )}
              {c.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.attachments.map((a, i) => (
                    <a key={i} href={fileUrl(a.url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-brand-600 hover:underline dark:bg-gray-800">
                      <FiPaperclip className="h-3 w-3" /> {a.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet. Start the conversation.</p>}
      </ul>
    </div>
  );
};

export default CommentSection;
