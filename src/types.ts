export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  color_name: string;
  color_hex: string;
  storage: string;
  price: number;
  mrp: number;
  image_url: string;
  gallery_images: string[];
  in_stock: number;
  stock_quantity: number;
}

export interface CalculatedPlan {
  principal: number;
  downpayment: number;
  financedPrincipal: number;
  monthly_emi: number;
  total_interest: number;
  total_payable: number;
  cashback_amount: number;
  net_payable_after_cashback: number;
  mf_projected_return: number;
  net_effective_cost: number;
  interest_fully_offset_by_mf: boolean;
}

export interface EmiPlan {
  id: string;
  product_id: string;
  tenure_months: number;
  interest_rate: number;
  downpayment_amount: number;
  processing_fee: number;
  cashback_amount: number;
  cashback_description: string;
  is_no_cost: number;
  is_popular: number;
  mutual_fund_id: string;
  mf_name: string;
  mf_amc: string;
  mf_nav: number;
  mf_cagr: number;
  mf_risk: string;
  mf_rating: number;
  calculated: CalculatedPlan;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  description: string;
  category: string;
  rating: number;
  reviews_count: number;
  base_price: number;
  base_mrp: number;
  default_image: string;
  highlights: string[];
  specs: Record<string, string>;
  variants?: ProductVariant[];
  emi_plans?: EmiPlan[];
  variants_count?: number;
  min_price?: number;
  min_mrp?: number;
  lowest_emi?: number;
  save_amount?: number;
}

export interface RepaymentInstallment {
  installment_no: number;
  due_date: string;
  emi_amount: number;
  principal: number;
  interest: number;
  remaining_balance: number;
}

export interface LoanApplicationResult {
  id: string;
  sanction_number: string;
  status: string;
  product_name: string;
  variant_name: string;
  product_price: number;
  tenure_months: number;
  monthly_emi: number;
  interest_rate: number;
  cashback_amount: number;
  backing_mutual_fund: string;
  customer: {
    name: string;
    phone: string;
    pan: string;
  };
  sanction_date: string;
  repayment_schedule: RepaymentInstallment[];
}
