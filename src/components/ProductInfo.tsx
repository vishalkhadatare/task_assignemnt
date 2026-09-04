import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  TrendingUp,
  Shield,
  RotateCcw,
  Crown,
  Truck,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Product, ProductVariant, EmiPlan } from '../types.ts';

interface ProductInfoProps {
  product: Product;
  selectedVariant: ProductVariant;
  emiPlans: EmiPlan[];
  selectedPlan: EmiPlan | null;
  onSelectPlan: (plan: EmiPlan) => void;
  onProceed: () => void;
  onSelectVariant?: (variant: ProductVariant) => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  selectedVariant,
  emiPlans,
  selectedPlan,
  onSelectPlan,
  onProceed,
  onSelectVariant,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('reviews');

  const getNextEmiDate = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `3rd ${monthNames[d.getMonth()]}`;
  };

  const downpayment = selectedPlan?.calculated?.downpayment || Math.round(selectedVariant.price * 0.15);
  const activeTenure = selectedPlan ? selectedPlan.tenure_months : 6;
  const discount = Math.max(0, selectedVariant.mrp - selectedVariant.price);
  const discountPercent = selectedVariant.mrp > 0 ? Math.round((discount / selectedVariant.mrp) * 100) : 0;
  const calc = selectedPlan?.calculated;

  return (
    <div className="space-y-6 lg:pt-6 pt-2">
      
      {/* 1. Header & Pricing Card */}
      <div className="bg-transparent border-0 shadow-none p-0 space-y-3 animate-fadeInUp">
        <div className="space-y-1.5">
          {/* Top badges line */}
          <div className="flex items-center justify-between flex-wrap gap-2 min-h-[20px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-red-600 text-xs font-extrabold uppercase tracking-wider">NEW</span>
              <span className="text-gray-300">•</span>
              <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 uppercase">
                {product.brand} OFFICIAL
              </span>
              <span className="text-xs font-semibold text-[#16a34a]">
                In Stock · Express Delivery
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                <span className="text-[#1a1a1a]">{product.rating.toFixed(1)}</span>
                <Star className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" />
                <span className="text-gray-500 font-medium ml-1">{product.reviews_count.toLocaleString('en-IN')} reviews</span>
              </div>
            </div>
          </div>

          {/* Product Name Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight">
            {product.name}
          </h1>
          
          {/* Subtitle with storage, RAM and color */}
          <p className="text-sm font-semibold text-gray-500">
            {selectedVariant.storage} · 12GB RAM · {selectedVariant.color_name}
          </p>

          {/* Pricing Strip */}
          <div className="pt-2 flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight">
                  ₹{selectedVariant.price.toLocaleString('en-IN')}
                </span>
                {discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{selectedVariant.mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs text-white font-bold bg-red-500 px-2 py-0.5 rounded">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">Inclusive of GST & All Shipping Charges</p>
            </div>

            <div className="text-right">
              <span className="bg-purple-100 text-purple-700 border border-purple-200 text-xs rounded px-2.5 py-1 font-semibold">
                Downpayment
              </span>
              <div className="mt-1 text-sm font-bold text-[#1a1a1a]">
                ₹{downpayment.toLocaleString('en-IN')} <span className="text-xs text-gray-500 font-normal">(15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Approval Banner */}
        <div className="rounded-md p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-teal-700 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">Fi Smart EMI Pre-Approval</p>
              <p className="text-xs text-gray-600 mt-0.5">Pledge existing liquid mutual funds. Zero impact on CIBIL.</p>
            </div>
          </div>
          <button className="text-xs font-bold text-white bg-[#ff5e00] hover:bg-[#e65500] px-3 py-1.5 rounded-md whitespace-nowrap">
            INSTANT 0% EMI
          </button>
        </div>
      </div>

      {/* 2. Choose EMI Plan Section */}
      <div className="bg-white rounded-md p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4 animate-fadeInUp stagger-2">
        
        {/* Tenure Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
          <div>
            <h3 className="text-base font-bold text-[#1a1a1a]">
              EMI plans backed by mutual funds
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pledge AAA Liquid Mutual Funds with daily yield accumulation
            </p>
          </div>
          <span className="text-sm text-gray-500 font-medium">
            EMIs start {getNextEmiDate()}
          </span>
        </div>

        {/* EMI Plans Card Grid */}
        <div className="space-y-3">
          {emiPlans.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const planMonthlyEmi = plan.calculated?.monthly_emi || Math.round((selectedVariant.price - downpayment) / plan.tenure_months);
            const isNoCost = plan.interest_rate === 0 || plan.is_no_cost === 1;

            return (
              <div
                key={plan.id}
                id={`plan-radio-${plan.tenure_months}`}
                onClick={() => onSelectPlan(plan)}
                className={`relative flex items-center justify-between rounded-md p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border border-transparent bg-gradient-to-r from-orange-50 to-white shadow-sm'
                    : 'border border-gray-200 bg-white hover:bg-gray-50 card-hover'
                }`}
              >
                {/* Plan tenure & monthly figure */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white flex-shrink-0">
                    {isSelected && <div className="w-2.5 h-2.5 bg-[#ff5e00] rounded-full animate-scaleIn" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-base font-bold text-[#1a1a1a]">
                        ₹{planMonthlyEmi.toLocaleString('en-IN')} x {plan.tenure_months} months
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-[#1a1a1a]">
                          {isNoCost ? '0% interest' : `${plan.interest_rate}% interest`}
                        </span>
                        {plan.is_popular === 1 && (
                          <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold rounded px-2 py-0.5">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>

                    {plan.cashback_amount > 0 && (
                      <div className="text-xs font-semibold text-[#16a34a] mt-1">
                        Additional cashback of ₹{plan.cashback_amount.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Simplified Math Engine */}
        {selectedPlan && calc && (
          <div className="rounded-md p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm mt-2">
            <h4 className="text-xs font-semibold text-[#1a1a1a] mb-2">Mutual Fund Yield Offset Engine</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-gray-100">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Principal</span>
                <span className="font-semibold text-[#1a1a1a]">₹{calc.principal.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-100">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Interest</span>
                <span className="font-semibold text-[#1a1a1a]">{calc.total_interest === 0 ? '₹0 (0%)' : `+₹${calc.total_interest.toLocaleString('en-IN')}`}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-100">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">MF Daily Gains</span>
                <span className="font-semibold text-[#16a34a]">-₹{calc.mf_projected_return.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-gray-100 p-2 rounded border border-gray-200">
                <span className="text-gray-600 block text-[10px] uppercase font-bold">Net Effective</span>
                <span className="font-bold text-sm text-[#1a1a1a]">₹{calc.net_effective_cost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Primary Checkout / Sanction CTA */}
        <div className="pt-2">
          <button
            id="btn-buy-emi"
            onClick={onProceed}
            className="w-full btn-gradient text-white font-bold text-sm rounded-md py-4 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] animate-pulseGlow"
          >
            Buy on {activeTenure} Months EMI — ₹{(selectedPlan?.calculated?.monthly_emi || Math.round((selectedVariant.price - downpayment) / activeTenure)).toLocaleString('en-IN')}/mo
          </button>
        </div>

        {/* Trust Badges Row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <div>
            <span className="block font-semibold text-gray-700">100% Lien Safety</span>
            Investments stay yours
          </div>
          <div>
            <span className="block font-semibold text-gray-700">Instant Sanction</span>
            Digital CIBIL check
          </div>
          <div>
            <span className="block font-semibold text-gray-700">Zero Charges</span>
            No foreclosure penalty
          </div>
        </div>

      </div>

      {/* 3. Assurance & Merchant Guarantee */}
      <div className="bg-white rounded-md p-5 border border-gray-200 shadow-sm space-y-4 animate-fadeInUp stagger-3">
        <h4 className="text-sm font-semibold text-[#1a1a1a]">
          Certified Brand Assurance
        </h4>

        <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-gray-400" />
            <span>2-Day Service Replacement</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-gray-400" />
            <span>100% Genuine Brand</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <span>Free Insured Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <span>RBI Regulated Lending</span>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Details: Specifications & Customer Reviews */}
      <div className="bg-transparent border-0 shadow-none p-0 space-y-4 animate-fadeInUp stagger-4">
        {/* Tab Headers */}
        <div className="flex items-center gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#ff5e00] text-[#ff5e00] font-semibold'
                : 'border-transparent text-gray-500 hover:text-[#1a1a1a]'
            }`}
          >
            Highlights
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'specs'
                ? 'border-[#ff5e00] text-[#ff5e00] font-semibold'
                : 'border-transparent text-gray-500 hover:text-[#1a1a1a]'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'reviews'
                ? 'border-[#ff5e00] text-[#ff5e00] font-semibold'
                : 'border-transparent text-gray-500 hover:text-[#1a1a1a]'
            }`}
          >
            Reviews ({product.reviews_count})
          </button>
        </div>

        {/* Tab 1: Overview / Highlights */}
        {activeTab === 'overview' && (
          <ul className="text-sm text-gray-600 space-y-3">
            {product.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Tab 2: Full Specifications */}
        {activeTab === 'specs' && (
          <div className="divide-y divide-gray-100 text-sm">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-medium text-gray-500">{key}</span>
                <span className="sm:col-span-2 text-[#1a1a1a]">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Customer Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Breakdown */}
            <div className="flex items-center gap-6 p-4 rounded-md bg-white/70 border-0 shadow-none">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1a1a1a]">{product.rating.toFixed(1)}</div>
                <div className="flex items-center text-[#f5a623] justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f5a623] text-[#f5a623]" />
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">{product.reviews_count} ratings</div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-gray-500">5★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="w-[85%] h-full bg-[#f5a623] rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 text-gray-500">4★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="w-[12%] h-full bg-[#f5a623] rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 text-gray-500">3★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="w-[3%] h-full bg-[#f5a623] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Reviews matching screenshot layout */}
            <div className="space-y-5 divide-y divide-gray-100">
              {/* Review 1 */}
              <div className="pt-2 space-y-1 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-[#f5a623]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#f5a623] text-[#f5a623]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-700">5</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Review for: Storage: 256 GB, Color: Cosmic Orange
                </div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  Good
                </p>
                <div className="text-xs text-gray-700 font-medium">
                  Jayalaxmi Arigela, tarnaka
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-[#16a34a] font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#16a34a]" /> Verified buyer
                  </span>
                  <span>•</span>
                  <span>4 months ago</span>
                </div>
              </div>

              {/* Review 2 */}
              <div className="pt-4 space-y-1 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-[#f5a623]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#f5a623] text-[#f5a623]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-700">5</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Review for: Storage: 256 GB, Color: Silver
                </div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  Excellent
                </p>
                <div className="text-xs text-gray-700 font-medium">
                  Ajad Ali, Unnao
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-[#16a34a] font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#16a34a]" /> Verified buyer
                  </span>
                  <span>•</span>
                  <span>4 months ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
