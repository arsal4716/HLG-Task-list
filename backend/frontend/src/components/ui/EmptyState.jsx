import { FiInbox } from 'react-icons/fi';

export const EmptyState = ({ icon: Icon = FiInbox, title = 'Nothing here yet', subtitle, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
    <div className="mb-3 rounded-full bg-gray-100 p-4 text-gray-400 dark:bg-gray-800">
      <Icon className="h-7 w-7" />
    </div>
    <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
    {subtitle && <p className="mt-1 max-w-sm text-sm text-gray-500">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
