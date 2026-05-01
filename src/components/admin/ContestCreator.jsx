import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FileUpload from '../ui/FileUpload';

const STEPS = ['Basic Info', 'Winner Logic', 'Review & Create'];

const initialForm = {
  title: '',
  offer_id: '',
  banner: null,
  target_audience: 'customer',
  target_merchant_id: '',
  start_date: '',
  end_date: '',
  algorithm: 'random_draw',
  winner_count: '1',
  prize_amount: '',
  eligibility_rules: '',
};

export default function ContestCreator({ onCreated }) {
  const { data: offersData } = useFetch('/admin/offers');
  const { data: merchantsData } = useFetch('/admin/merchants');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  const offers = offersData?.offers || [];
  const merchants = (merchantsData?.merchants || merchantsData || []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((f) => ({ ...f, [name]: files[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const canNext = () => {
    if (step === 0) return form.title && form.start_date && form.end_date &&
      (form.target_audience !== 'merchant_customers' || form.target_merchant_id);
    if (step === 1) return form.algorithm;
    return true;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      if (form.offer_id) formData.append('offer_id', form.offer_id);
      if (form.banner) formData.append('banner', form.banner);
      formData.append('target_audience', form.target_audience);
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('algorithm', form.algorithm);
      formData.append('winner_count', form.winner_count || '1');
      formData.append('num_winners', form.winner_count || '1');
      if (form.prize_amount) formData.append('prize_amount', form.prize_amount);
      if (form.eligibility_rules) formData.append('eligibility_rules', form.eligibility_rules);
      if (form.target_merchant_id) formData.append('target_merchant_id', form.target_merchant_id);

      await api.post('/admin/contests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Contest created successfully!');
      setForm(initialForm);
      setStep(0);
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create contest');
    } finally {
      setCreating(false);
    }
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 2)); };
  const goPrev = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[#8b5cf6]/10">
          <Trophy className="w-5 h-5 text-[#8b5cf6]" />
        </div>
        <h2 className="text-xl font-bold text-white">Create Contest</h2>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
              ${i < step
                ? 'bg-[#e94560] text-white'
                : i === step
                  ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/40'
                  : 'bg-white/5 text-white/30 border border-white/10'
              }
            `}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-white/80' : 'text-white/30'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-[#e94560]/40' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[320px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <Input
                  label="Contest Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Summer Lucky Draw"
                />
                <Select
                  label="Linked Offer (optional)"
                  name="offer_id"
                  value={form.offer_id}
                  onChange={handleChange}
                  placeholder="Select an offer"
                  options={offers.map((o) => ({ value: o._id || o.id, label: o.title }))}
                />
                <FileUpload
                  label="Contest Banner"
                  name="banner"
                  accept="image/*"
                  preview
                  onChange={handleChange}
                />
                <Select
                  label="Target Audience"
                  name="target_audience"
                  value={form.target_audience}
                  onChange={handleChange}
                  options={[
                    { value: 'customer',           label: 'All customers (QR scans during contest window)' },
                    { value: 'merchant_customers', label: "Customers of a specific merchant" },
                    { value: 'merchant',           label: 'All merchants (active shops)' },
                    { value: 'promoter',           label: 'All promoters (active promoters)' },
                  ]}
                />
                {form.target_audience === 'merchant_customers' && (
                  <Select
                    label="Select Merchant"
                    name="target_merchant_id"
                    value={form.target_merchant_id}
                    onChange={handleChange}
                    placeholder="Choose a merchant…"
                    options={merchants.map((m) => ({
                      value: m._id || m.id,
                      label: m.shop_name || m.user_id?.name || m.user_id?.phone || m._id,
                    }))}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
                  <Input label="End Date"   name="end_date"   type="date" value={form.end_date}   onChange={handleChange} required />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Select
                  label="Winner Selection Algorithm"
                  name="algorithm"
                  value={form.algorithm}
                  onChange={handleChange}
                  options={[
                    { value: 'random_draw', label: 'Random Draw' },
                    { value: 'first_n',     label: 'First N Entries' },
                  ]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Number of Winners"
                    name="winner_count"
                    type="number"
                    min="1"
                    value={form.winner_count}
                    onChange={handleChange}
                    placeholder="e.g. 3"
                    required
                  />
                  <Input
                    label="Total Prize Pool (₹)"
                    name="prize_amount"
                    type="number"
                    min="0"
                    value={form.prize_amount}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                  />
                </div>
                {Number(form.prize_amount) > 0 && Number(form.winner_count) > 0 && (
                  <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-sm text-amber-300">
                    ₹{Math.floor(Number(form.prize_amount) / Number(form.winner_count))} per winner · auto-credited to their wallet on draw
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Eligibility Rules</label>
                  <textarea
                    name="eligibility_rules"
                    value={form.eligibility_rules}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe eligibility criteria..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/20 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Review Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Title',           value: form.title },
                    { label: 'Target Audience', value: form.target_audience },
                    { label: 'Start Date',      value: form.start_date },
                    { label: 'End Date',        value: form.end_date },
                    { label: 'Algorithm',       value: form.algorithm.replace('_', ' ') },
                    { label: 'Winners',         value: form.winner_count || '1' },
                    { label: 'Prize Pool',      value: form.prize_amount ? `₹${Number(form.prize_amount).toLocaleString('en-IN')}` : '—' },
                    { label: 'Per Winner',      value: (form.prize_amount && form.winner_count) ? `₹${Math.floor(Number(form.prize_amount)/Number(form.winner_count)).toLocaleString('en-IN')}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 mb-1">{label}</p>
                      <p className="text-sm text-white font-medium capitalize">{value}</p>
                    </div>
                  ))}
                </div>
                {form.eligibility_rules && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/40 mb-1">Eligibility Rules</p>
                    <p className="text-sm text-white/70">{form.eligibility_rules}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
        <Button variant="ghost" icon={ChevronLeft} onClick={goPrev} disabled={step === 0}>
          Back
        </Button>
        {step < 2 ? (
          <Button icon={ChevronRight} onClick={goNext} disabled={!canNext()}>Next</Button>
        ) : (
          <Button icon={Check} onClick={handleCreate} loading={creating}>Create Contest</Button>
        )}
      </div>
    </GlassCard>
  );
}
