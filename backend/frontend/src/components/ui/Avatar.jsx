import { initials, fileUrl } from '../../utils/format.js';

const SIZES = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-20 w-20 text-2xl' };

export const Avatar = ({ user, size = 'md', online = false, className = '' }) => {
  const src = user?.profileImage ? fileUrl(user.profileImage) : null;
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={user?.name}
          className={`${SIZES[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-900`}
        />
      ) : (
        <span
          className={`${SIZES[size]} inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white dark:bg-brand-900/50 dark:text-brand-200 dark:ring-gray-900`}
        >
          {initials(user?.name) || '?'}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
      )}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 3, size = 'sm' }) => (
  <div className="flex -space-x-2">
    {users.slice(0, max).map((u) => (
      <Avatar key={u._id || u.name} user={u} size={size} />
    ))}
    {users.length > max && (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-900">
        +{users.length - max}
      </span>
    )}
  </div>
);

export default Avatar;
