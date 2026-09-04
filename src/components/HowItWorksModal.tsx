import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white rounded-md max-w-2xl w-full shadow-2xl overflow-hidden animate-modalEnter">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff5e00] to-[#ff8533] text-white px-6 py-4 rounded-t-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20 text-white border border-white/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                The Fi Advantage
              </span>
              <h3 className="text-lg font-bold mt-0.5 text-white">
                How Mutual Fund Backed EMI Works
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-[#1a1a1a] text-sm">
          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Step 1 */}
            <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between hover:shadow-md transition-all card-hover">
              <div>
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#ff5e00] to-[#ff8533] text-white font-bold text-sm shadow-sm flex items-center justify-center mb-3">
                  1
                </div>
                <h4 className="font-bold text-[#1a1a1a]">Select Your Phone</h4>
                <p className="text-[#666666] mt-2">
                  Choose your smartphone variant and select a tenure between 3 to 24 months with 0% No Cost EMI options.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 text-xs font-bold text-[#1a1a1a]">
                Zero Downpayment Option
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between hover:shadow-md transition-all card-hover">
              <div>
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#ff5e00] to-[#ff8533] text-white font-bold text-sm shadow-sm flex items-center justify-center mb-3">
                  2
                </div>
                <h4 className="font-bold text-[#1a1a1a]">Pledge Liquid Units</h4>
                <p className="text-[#666666] mt-2">
                  Units in top CRISIL 5-Star Liquid Mutual Funds act as security. Your capital continues earning ~7.2% CAGR daily.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 text-xs font-bold text-[#1a1a1a]">
                Zero Capital Dilution
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between hover:shadow-md transition-all card-hover">
              <div>
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#ff5e00] to-[#ff8533] text-white font-bold text-sm shadow-sm flex items-center justify-center mb-3">
                  3
                </div>
                <h4 className="font-bold text-[#1a1a1a]">Returns Neutralize Cost</h4>
                <p className="text-[#666666] mt-2">
                  As you pay your regular monthly installment, the compounding daily returns offset financing, lowering your net cost.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 text-xs font-bold text-[#1a1a1a]">
                Zero Prepayment Fees
              </div>
            </div>

          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <h4 className="font-bold text-[#1a1a1a] p-4 border-b border-gray-200">
              Traditional Consumer Loan vs Fi Smart EMI
            </h4>
            <div className="w-full">
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border-b border-gray-200 font-bold text-[#666666] text-xs uppercase">
                <span>Feature</span>
                <span>Traditional Loans</span>
                <span className="text-[#ff5e00]">Fi Smart EMI</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 p-3 border-b border-gray-200 text-sm items-center">
                <span className="font-semibold text-gray-900">Interest Rates</span>
                <span className="text-[#dc2626]">16% - 24% p.a.</span>
                <span className="font-bold text-white bg-[#00b853] px-2 py-1 rounded text-xs w-fit">0% No Cost</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 border-b border-gray-200 text-sm items-center bg-gray-50">
                <span className="font-semibold text-gray-900">Collateral Compounding</span>
                <span className="text-[#666666]">0% (None)</span>
                <span className="font-bold text-[#16a34a]">~7.2% CAGR Daily</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 border-b border-gray-200 text-sm items-center">
                <span className="font-semibold text-gray-900">Foreclosure Fee</span>
                <span className="text-[#dc2626]">3% to 5% Penalty</span>
                <span className="font-bold text-[#1a1a1a]">₹0 (Zero Charges)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 text-sm items-center bg-gray-50">
                <span className="font-semibold text-gray-900">Credit Bureau Impact</span>
                <span className="text-[#666666]">Full Unsecured Debt</span>
                <span className="font-bold text-[#16a34a]">Protected by Lien</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 btn-gradient text-white font-bold rounded-md shadow-md hover:shadow-lg transition-colors cursor-pointer"
          >
            Got it, Let's Choose a Plan
          </button>
        </div>
      </div>
    </div>
  );
};
