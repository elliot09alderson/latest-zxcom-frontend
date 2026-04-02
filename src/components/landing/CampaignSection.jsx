import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import api from '../../config/api';
import OfferCard from './OfferCard';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function CampaignSection() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get('/public/offers');
        setOffers(data.data?.offers || data.offers || []);
      } catch {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No Active Campaigns"
        description="Check back soon for exciting new campaigns and offers!"
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {offers.map((offer) => (
        <motion.div key={offer._id || offer.id} variants={itemVariants}>
          <OfferCard offer={offer} />
        </motion.div>
      ))}
    </motion.div>
  );
}
