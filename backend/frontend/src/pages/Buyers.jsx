import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiChevronRight,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiBriefcase,
} from 'react-icons/fi';
import { buyerService, campaignService, publisherService } from '../services/index.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx';
import { errMessage } from '../lib/axios.js';

/* ----------------------------- pills ----------------------------- */
const StatusPill = ({ status }) => (
  <span
    className={`badge ${
      status === 'Active'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    }`}
  >
    {status}
  </span>
);

const PerfPill = ({ value }) => {
  const map = {
    Good: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Average: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Bad: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  return <span className={`badge ${map[value] || map.Average}`}>{value}</span>;
};

/* ----------------------------- main ----------------------------- */
const Buyers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [expanded, setExpanded] = useState(null);
  const [buyerModal, setBuyerModal] = useState({ open: false, buyer: null });
  const [deleteBuyer, setDeleteBuyer] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['buyers', debounced],
    queryFn: () => buyerService.list({ search: debounced || undefined, limit: 100 }),
  });
  const buyers = data?.data || [];

  const remove = useMutation({
    mutationFn: (id) => buyerService.remove(id),
    onSuccess: () => {
      toast.success('Buyer deleted');
      setDeleteBuyer(null);
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Buyers & Campaigns"
        subtitle="Each buyer is a parent record — expand a buyer to manage its campaigns and publishers."
        actions={
          <button className="btn-primary" onClick={() => setBuyerModal({ open: true, buyer: null })}>
            <FiPlus className="h-4 w-4" /> Add Buyer
          </button>
        }
      />

      <div className="card mb-5 p-4">
        <div className="relative max-w-sm">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search buyers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : buyers.length === 0 ? (
        <EmptyState
          icon={FiBriefcase}
          title="No buyers yet"
          subtitle="Add your first buyer to start organizing campaigns."
          action={<button className="btn-primary" onClick={() => setBuyerModal({ open: true, buyer: null })}><FiPlus /> Add Buyer</button>}
        />
      ) : (
        <div className="space-y-3">
          {buyers.map((b) => (
            <div key={b._id} className="card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpanded((id) => (id === b._id ? null : b._id))}
                  className="btn-ghost p-1"
                >
                  {expanded === b._id ? <FiChevronDown className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
                </button>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white"
                  title={b.name}
                >
                  <FiBriefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpanded((id) => (id === b._id ? null : b._id))}>
                  <p className="font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {b.company || '—'} {b.email ? `· ${b.email}` : ''}
                  </p>
                </div>
                <span className="hidden text-xs text-gray-400 sm:inline">
                  {b.campaignCount} campaign{b.campaignCount === 1 ? '' : 's'}
                </span>
                <StatusPill status={b.status} />
                <button onClick={() => setBuyerModal({ open: true, buyer: b })} className="btn-ghost p-1.5">
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteBuyer(b)} className="btn-ghost p-1.5 text-red-500">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>

              {expanded === b._id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <CampaignsPanel buyer={b} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BuyerModal modal={buyerModal} onClose={() => setBuyerModal({ open: false, buyer: null })} />
      <ConfirmDialog
        open={!!deleteBuyer}
        onClose={() => setDeleteBuyer(null)}
        onConfirm={() => remove.mutate(deleteBuyer._id)}
        title="Delete buyer?"
        message={`This deletes ${deleteBuyer?.name} and ALL of its campaigns and publishers.`}
        confirmText="Delete"
        loading={remove.isPending}
      />
    </div>
  );
};

/* ----------------------------- campaigns ----------------------------- */
const CampaignsPanel = ({ buyer }) => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, campaign: null });
  const [publishersFor, setPublishersFor] = useState(null);
  const [del, setDel] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', buyer._id],
    queryFn: () => buyerService.campaigns(buyer._id),
  });
  const campaigns = data?.data?.campaigns || [];

  const remove = useMutation({
    mutationFn: (id) => campaignService.remove(id),
    onSuccess: () => {
      toast.success('Campaign deleted');
      setDel(null);
      queryClient.invalidateQueries({ queryKey: ['campaigns', buyer._id] });
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Campaigns</h3>
        <button className="btn-secondary py-1" onClick={() => setModal({ open: true, campaign: null })}>
          <FiPlus className="h-4 w-4" /> Add Campaign
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : campaigns.length === 0 ? (
        <p className="py-4 text-sm text-gray-400">No campaigns yet for this buyer.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-white text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-3 py-2">Campaign</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Payment Terms</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-gray-500">{c.module || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{c.paymentTerms || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{c.contactName || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setPublishersFor(c)} className="btn-ghost py-1 text-xs text-brand-600">
                        <FiUsers className="h-3.5 w-3.5" /> {c.publisherCount ?? 0}
                      </button>
                      <button onClick={() => setModal({ open: true, campaign: c })} className="btn-ghost p-1.5">
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDel(c)} className="btn-ghost p-1.5 text-red-500">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CampaignModal buyerId={buyer._id} modal={modal} onClose={() => setModal({ open: false, campaign: null })} />
      {publishersFor && <PublishersModal campaign={publishersFor} onClose={() => setPublishersFor(null)} />}
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => remove.mutate(del._id)}
        title="Delete campaign?"
        message={`This deletes "${del?.name}" and all its publishers.`}
        confirmText="Delete"
        loading={remove.isPending}
      />
    </div>
  );
};

/* ----------------------------- publishers ----------------------------- */
const PublishersModal = ({ campaign, onClose }) => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, publisher: null });
  const [del, setDel] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['publishers', campaign._id],
    queryFn: () => campaignService.publishers(campaign._id),
  });
  const publishers = data?.data?.publishers || [];

  const remove = useMutation({
    mutationFn: (id) => publisherService.remove(id),
    onSuccess: () => {
      toast.success('Publisher removed');
      setDel(null);
      queryClient.invalidateQueries({ queryKey: ['publishers', campaign._id] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <Modal open onClose={onClose} title={`Publishers · ${campaign.name}`} size="xl">
      <div className="mb-3 flex justify-end">
        <button className="btn-primary py-1.5" onClick={() => setModal({ open: true, publisher: null })}>
          <FiPlus className="h-4 w-4" /> Add Publisher
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : publishers.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No publishers sending calls to this campaign yet.</p>
      ) : (
        <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-3 py-2">Publisher</th>
                <th className="px-3 py-2">Payout</th>
                <th className="px-3 py-2">Payment Terms</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Performance</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {publishers.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">${Number(p.payout || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-500">{p.paymentTerms || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{p.email || '—'}</td>
                  <td className="px-3 py-2"><StatusPill status={p.status} /></td>
                  <td className="px-3 py-2"><PerfPill value={p.performance} /></td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setModal({ open: true, publisher: p })} className="btn-ghost p-1.5">
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDel(p)} className="btn-ghost p-1.5 text-red-500">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PublisherModal campaignId={campaign._id} modal={modal} onClose={() => setModal({ open: false, publisher: null })} />
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => remove.mutate(del._id)}
        title="Remove publisher?"
        message={`Remove ${del?.name} from this campaign?`}
        confirmText="Remove"
        loading={remove.isPending}
      />
    </Modal>
  );
};

/* ----------------------------- forms ----------------------------- */
const BuyerModal = ({ modal, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!modal.buyer;
  const { register, handleSubmit, reset } = useForm();

  const save = useMutation({
    mutationFn: (payload) => (isEdit ? buyerService.update(modal.buyer._id, payload) : buyerService.create(payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'Buyer updated' : 'Buyer created');
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <Modal
      open={modal.open}
      onClose={onClose}
      title={isEdit ? 'Edit Buyer' : 'Add Buyer'}
      size="md"
    >
      <form
        key={modal.buyer?._id || 'new'}
        onSubmit={handleSubmit((v) => save.mutate(v))}
        className="space-y-4"
      >
        <div>
          <label className="label">Buyer name *</label>
          <input className="input" defaultValue={modal.buyer?.name} {...register('name', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Company</label>
            <input className="input" defaultValue={modal.buyer?.company} {...register('company')} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" defaultValue={modal.buyer?.status || 'Active'} {...register('status')}>
              <option>Active</option>
              <option>Paused</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input className="input" defaultValue={modal.buyer?.email} {...register('email')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" defaultValue={modal.buyer?.phone} {...register('phone')} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" defaultValue={modal.buyer?.notes} {...register('notes')} />
        </div>
        <FormActions onClose={onClose} pending={save.isPending} isEdit={isEdit} />
      </form>
    </Modal>
  );
};

const CampaignModal = ({ buyerId, modal, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!modal.campaign;
  const { register, handleSubmit } = useForm();

  const save = useMutation({
    mutationFn: (payload) =>
      isEdit ? campaignService.update(modal.campaign._id, payload) : buyerService.createCampaign(buyerId, payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Campaign updated' : 'Campaign created');
      queryClient.invalidateQueries({ queryKey: ['campaigns', buyerId] });
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <Modal open={modal.open} onClose={onClose} title={isEdit ? 'Edit Campaign' : 'Add Campaign'} size="md">
      <form key={modal.campaign?._id || 'new'} onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div>
          <label className="label">Campaign name *</label>
          <input className="input" defaultValue={modal.campaign?.name} {...register('name', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Module</label>
            <input className="input" defaultValue={modal.campaign?.module} {...register('module')} />
          </div>
          <div>
            <label className="label">Payment terms</label>
            <input className="input" defaultValue={modal.campaign?.paymentTerms} {...register('paymentTerms')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact name</label>
            <input className="input" defaultValue={modal.campaign?.contactName} {...register('contactName')} />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" defaultValue={modal.campaign?.phone} {...register('phone')} />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" defaultValue={modal.campaign?.status || 'Active'} {...register('status')}>
            <option>Active</option>
            <option>Paused</option>
          </select>
        </div>
        <FormActions onClose={onClose} pending={save.isPending} isEdit={isEdit} />
      </form>
    </Modal>
  );
};

const PublisherModal = ({ campaignId, modal, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!modal.publisher;
  const { register, handleSubmit } = useForm();

  const save = useMutation({
    mutationFn: (payload) => {
      const body = { ...payload, payout: Number(payload.payout) || 0 };
      return isEdit
        ? publisherService.update(modal.publisher._id, body)
        : campaignService.createPublisher(campaignId, body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Publisher updated' : 'Publisher added');
      queryClient.invalidateQueries({ queryKey: ['publishers', campaignId] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <Modal open={modal.open} onClose={onClose} title={isEdit ? 'Edit Publisher' : 'Add Publisher'} size="md">
      <form key={modal.publisher?._id || 'new'} onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div>
          <label className="label">Publisher name *</label>
          <input className="input" defaultValue={modal.publisher?.name} {...register('name', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Payout ($)</label>
            <input type="number" step="0.01" min="0" className="input" defaultValue={modal.publisher?.payout} {...register('payout')} />
          </div>
          <div>
            <label className="label">Payment terms</label>
            <input className="input" defaultValue={modal.publisher?.paymentTerms} {...register('paymentTerms')} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" defaultValue={modal.publisher?.email} {...register('email')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" defaultValue={modal.publisher?.status || 'Active'} {...register('status')}>
              <option>Active</option>
              <option>Paused</option>
            </select>
          </div>
          <div>
            <label className="label">Performance</label>
            <select className="input" defaultValue={modal.publisher?.performance || 'Average'} {...register('performance')}>
              <option>Good</option>
              <option>Average</option>
              <option>Bad</option>
            </select>
          </div>
        </div>
        <FormActions onClose={onClose} pending={save.isPending} isEdit={isEdit} />
      </form>
    </Modal>
  );
};

const FormActions = ({ onClose, pending, isEdit }) => (
  <div className="flex justify-end gap-2 pt-2">
    <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
    </button>
  </div>
);

export default Buyers;
