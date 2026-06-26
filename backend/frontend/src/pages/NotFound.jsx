import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <p className="text-7xl font-extrabold text-brand-600">404</p>
    <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
    <p className="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
    <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
  </div>
);

export default NotFound;
