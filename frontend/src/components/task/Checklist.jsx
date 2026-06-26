import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { taskService } from '../../services/index.js';

export const Checklist = ({ task }) => {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task', task._id] });

  const add = useMutation({ mutationFn: (t) => taskService.addChecklist(task._id, t), onSuccess: invalidate });
  const toggle = useMutation({ mutationFn: (itemId) => taskService.toggleChecklist(task._id, itemId), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (itemId) => taskService.removeChecklist(task._id, itemId), onSuccess: invalidate });

  const items = task.checklist || [];
  const done = items.filter((i) => i.completed).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Checklist</h3>
        <span className="text-sm text-gray-400">{done}/{items.length} · {pct}%</span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item._id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggle.mutate(item._id)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : ''}`}>{item.text}</span>
            <button onClick={() => remove.mutate(item._id)} className="text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500">
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          add.mutate(text);
          setText('');
        }}
        className="mt-3 flex gap-2"
      >
        <input className="input" placeholder="Add an item…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-secondary" type="submit"><FiPlus className="h-4 w-4" /></button>
      </form>
    </div>
  );
};

export default Checklist;
