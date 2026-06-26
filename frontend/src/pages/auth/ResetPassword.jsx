import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AuthShell } from './AuthShell.jsx';
import { authService } from '../../services/index.js';
import { errMessage } from '../../lib/axios.js';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, { password: values.password });
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            className="input"
            {...register('confirm', {
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
          {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
};

export default ResetPassword;
