import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Eye, Calendar, Users, Coins, Target, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

export default function ContestList() {
  const { data, loading, error, refetch } = useFetch('/admin/contests');
  const [drawingId, setDrawingId] = useState(null);
  const [entriesModal, setEntriesModal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const contests = data?.contests || [];

  const getStatusVariant = (status) => {
    const map = { draft: 'default', active: 'success', completed: 'info', cancelled: 'danger' };
    return map[status?.toLowerCase()] || 'default';
  };

  const handleDrawWinners = useCallback(async (contestId) => {
    setDrawingId(contestId);
    try {
      const res = await api.post(`/admin/contests/${contestId}/draw`);
      const winnerCount = res.data?.data?.winner_count ?? res.data?.winners?.length ?? 0;
      toast.success(`Winners drawn! ${winnerCount} winner(s) selected.`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to draw winners');
    } finally {
      setDrawingId(null);
    }
  }, [refetch]);

  const handleDelete = async (row) => {
    try {
      await api.delete(`/admin/contests/${row._id || row.id}`);
      toast.success('Contest deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };
  const handleBulkDelete = async (rows) => {
    try {
      await api.post('/admin/contests/bulk-delete', { ids: rows.map((r) => r._id || r.id) });
      toast.success(`Deleted ${rows.length} contests`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    }
  };
  const handleDeleteAll = async () => {
    try {
      await api.delete('/admin/contests');
      toast.success('All contests deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete all failed');
    }
  };

  const handleViewEntries = useCallback(async (contest) => {
    const id = contest._id || contest.id;
    setEntriesModal(contest);
    setLoadingEntries(true);
    try {
      const res = await api.get(`/admin/contests/${id}/entries`);
      setEntries(res.data?.data?.entries || res.data?.entries || []);
    } catch (err) {
      toast.error('Failed to load entries');
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge text={val || 'draft'} variant={getStatusVariant(val)} />,
    },
    {
      key: 'target_audience',
      label: 'Audience',
      render: (val) => <span className="capitalize">{val || 'all'}</span>,
    },
    {
      key: 'algorithm',
      label: 'Algorithm',
      render: (val) => <span className="capitalize">{(val || '').replace('_', ' ')}</span>,
    },
    {
      key: 'start_date',
      label: 'Start',
      render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-',
    },
    {
      key: 'end_date',
      label: 'End',
      render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      exportable: false,
      render: (_, row) => {
        const id = row._id || row.id;
        const isCompleted = row.status?.toLowerCase() === 'completed';

        return (
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={() => handleDrawWinners(id)}
                disabled={drawingId === id}
                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer disabled:opacity-50"
                title="Draw Winners"
              >
                {drawingId === id ? (
                  <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => handleViewEntries(row)}
              className="p-1.5 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer"
              title="View Entries"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[#8b5cf6]/10">
          <Trophy className="w-5 h-5 text-[#8b5cf6]" />
        </div>
        <h2 className="text-xl font-bold text-white">Contests</h2>
        <span className="text-xs text-white/40 ml-1">({contests.length})</span>
      </div>

      {error ? (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={contests}
          title="Contests"
          exportFilename="contests"
          searchable
          searchFields={['title', 'status', 'target_audience', 'algorithm']}
          searchPlaceholder="Search contests..."
          exportable
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onDeleteAll={handleDeleteAll}
          emptyMessage="No contests yet. Create one above to get started."
        />
      )}

      {/* Contest Detail + Entries Modal */}
      <Modal
        isOpen={!!entriesModal}
        onClose={() => { setEntriesModal(null); setEntries([]); }}
        title={entriesModal?.title || 'Contest'}
        size="lg"
      >
        {entriesModal && (
          <div className="space-y-4">
            {/* Banner */}
            {entriesModal.banner_image_url && (
              <img
                src={entriesModal.banner_image_url.startsWith('http') ? entriesModal.banner_image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${entriesModal.banner_image_url}`}
                alt="Contest banner"
                className="w-full h-40 object-cover rounded-xl border border-white/10"
              />
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Start</p>
                  <p className="text-xs text-white">{entriesModal.start_date ? new Date(entriesModal.start_date).toLocaleDateString('en-IN') : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">End</p>
                  <p className="text-xs text-white">{entriesModal.end_date ? new Date(entriesModal.end_date).toLocaleDateString('en-IN') : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <Target className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Audience</p>
                  <p className="text-xs text-white capitalize">{entriesModal.target_audience || 'all'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <Users className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Winners</p>
                  <p className="text-xs text-white">{entriesModal.first_n_count || entriesModal.winner_count || '-'}</p>
                </div>
              </div>
              {(entriesModal.prize_amount || entriesModal.prize_pool || entriesModal.prize) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Coins className="w-4 h-4 text-amber-400/70 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wide">Prize Pool</p>
                    <p className="text-xs text-amber-400">₹{entriesModal.prize_amount || entriesModal.prize_pool || entriesModal.prize}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <Shuffle className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Algorithm</p>
                  <p className="text-xs text-white capitalize">{(entriesModal.algorithm || entriesModal.winner_selection_algorithm || '-').replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {entriesModal.description && (
              <p className="text-xs text-white/50 px-1">{entriesModal.description}</p>
            )}

            {/* Entries */}
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Entries ({entries.length})
              </p>
              {loadingEntries ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-6 text-white/30 text-sm">No entries yet</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {entries.map((entry, i) => (
                    <div
                      key={entry._id || entry.id || i}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div>
                        <p className="text-sm text-white font-medium">
                          {entry.name || entry.participant_name || `Entry #${i + 1}`}
                        </p>
                        <p className="text-xs text-white/40">
                          {entry.phone || entry.email || ''}{' '}
                          {entry.submitted_at && `· ${new Date(entry.submitted_at).toLocaleDateString('en-IN')}`}
                        </p>
                      </div>
                      <Badge
                        text={entry.status || 'submitted'}
                        variant={entry.status === 'winner' ? 'success' : 'default'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
