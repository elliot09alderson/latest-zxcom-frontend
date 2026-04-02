import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FileUpload from '../ui/FileUpload';

const STEPS = ['Basic Info', 'Filters', 'Winner Logic', 'Review & Create'];

const initialForm = {
  title: '',
  offer_id: '',
  banner: null,
  target_audience: 'all',
  areas: [],
  shop_categories: [],
  plan_types: { basic: false, premium: false, enterprise: false },
  min_submissions: '',
  start_date: '',
  end_date: '',
  algorithm: 'random_draw',
  winner_count: '',
  eligibility_rules: '',
};

export default function ContestCreator({ onCreated }) {
  const { data: offersData } = useFetch('/admin/offers');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [areaInput, setAreaInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [creating, setCreating] = useState(false);

  const offers = offersData?.offers || [];

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (files) {
      setForm((f) => ({ ...f, [name]: files[0] || null }));
    } else if (name.startsWith('plan_')) {
      const planKey = name.replace('plan_', '');
      setForm((f) => ({
        ...f,
        plan_types: { ...f.plan_types, [planKey]: checked },
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const addArea = () => {
    const trimmed = areaInput.trim();
    if (trimmed && !form.areas.includes(trimmed)) {
      setForm((f) => ({ ...f, areas: [...f.areas, trimmed] }));
    }
    setAreaInput('');
  };

  const removeArea = (area) => {
    setForm((f) => ({ ...f, areas: f.areas.filter((a) => a !== area) }));
  };

  const addCategory = () => {
    const trimmed = categoryInput.trim();
    if (trimmed && !form.shop_categories.includes(trimmed)) {
      setForm((f) => ({ ...f, shop_categories: [...f.shop_categories, trimmed] }));
    }
    setCategoryInput('');
  };

  const removeCategory = (cat) => {
    setForm((f) => ({ ...f, shop_categories: f.shop_categories.filter((c) => c !== cat) }));
  };

  const canNext = () => {
    if (step === 0) return form.title && form.start_date && form.end_date;
    if (step === 1) return true;
    if (step === 2) return form.algorithm;
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
      if (form.winner_count) formData.append('winner_count', form.winner_count);
      if (form.eligibility_rules) formData.append('eligibility_rules', form.eligibility_rules);
      if (form.min_submissions) formData.append('min_submissions', form.min_submissions);
      if (form.areas.length) formData.append('areas', JSON.stringify(form.areas));
      if (form.shop_categories.length) formData.append('shop_categories', JSON.stringify(form.shop_categories));

      const selectedPlans = Object.entries(form.plan_types)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (selectedPlans.length) formData.append('plan_types', JSON.stringify(selectedPlans));

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

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

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
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
                ${i < step
                  ? 'bg-[#e94560] text-white'
                  : i === step
                    ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/40'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }
              `}
            >
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
                  options={offers.map((o) => ({
                    value: o._id || o.id,
                    label: o.title,
                  }))}
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
                    { value: 'all', label: 'All' },
                    { value: 'merchants', label: 'Merchants Only' },
                    { value: 'customers', label: 'Customers Only' },
                  ]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="End Date"
                    name="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                {/* Areas multi-input */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Areas</label>
                  <div className="flex gap-2">
                    <input
                      value={areaInput}
                      onChange={(e) => setAreaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                      placeholder="Type area and press Enter"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#e94560]/60 transition-colors"
                    />
                    <Button size="sm" icon={Plus} onClick={addArea}>Add</Button>
                  </div>
                  {form.areas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.areas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white/70"
                        >
                          {area}
                          <button onClick={() => removeArea(area)} className="text-white/40 hover:text-white cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shop Categories multi-input */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Shop Categories</label>
                  <div className="flex gap-2">
                    <input
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                      placeholder="Type category and press Enter"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#e94560]/60 transition-colors"
                    />
                    <Button size="sm" icon={Plus} onClick={addCategory}>Add</Button>
                  </div>
                  {form.shop_categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.shop_categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white/70"
                        >
                          {cat}
                          <button onClick={() => removeCategory(cat)} className="text-white/40 hover:text-white cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plan Type Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Plan Types</label>
                  <div className="flex gap-4">
                    {Object.keys(form.plan_types).map((plan) => (
                      <label key={plan} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`plan_${plan}`}
                          checked={form.plan_types[plan]}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#e94560] focus:ring-[#e94560]/20"
                        />
                        <span className="text-sm text-white/70 capitalize">{plan}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Input
                  label="Min Submission Volume"
                  name="min_submissions"
                  type="number"
                  value={form.min_submissions}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Select
                  label="Winner Selection Algorithm"
                  name="algorithm"
                  value={form.algorithm}
                  onChange={handleChange}
                  options={[
                    { value: 'random_draw', label: 'Random Draw' },
                    { value: 'first_n', label: 'First N Entries' },
                  ]}
                />
                {form.algorithm === 'first_n' && (
                  <Input
                    label="Winner Count"
                    name="winner_count"
                    type="number"
                    value={form.winner_count}
                    onChange={handleChange}
                    placeholder="Number of winners"
                    required
                  />
                )}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    Eligibility Rules
                  </label>
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

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Review Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Title', value: form.title },
                    { label: 'Target Audience', value: form.target_audience },
                    { label: 'Start Date', value: form.start_date },
                    { label: 'End Date', value: form.end_date },
                    { label: 'Algorithm', value: form.algorithm.replace('_', ' ') },
                    { label: 'Winner Count', value: form.winner_count || 'N/A' },
                    { label: 'Areas', value: form.areas.join(', ') || 'All' },
                    { label: 'Min Submissions', value: form.min_submissions || 'None' },
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
        <Button
          variant="ghost"
          icon={ChevronLeft}
          onClick={goPrev}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < 3 ? (
          <Button
            icon={ChevronRight}
            onClick={goNext}
            disabled={!canNext()}
          >
            Next
          </Button>
        ) : (
          <Button
            icon={Check}
            onClick={handleCreate}
            loading={creating}
          >
            Create Contest
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
