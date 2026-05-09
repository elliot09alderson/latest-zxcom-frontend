import MerchantRegisterForm from '../../components/merchant/MerchantRegisterForm';

export default function MerchantSetupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-10">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Complete Your Merchant Setup</h1>
        <p className="text-white/50 text-sm mt-2">
          Fill in your shop details, choose a plan and pay to activate your merchant account.
        </p>
      </div>
      <MerchantRegisterForm />
    </div>
  );
}
