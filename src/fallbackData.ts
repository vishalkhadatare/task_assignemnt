import { Product, ProductVariant, EmiPlan } from './types.ts';

function computeEmi(fullPrice: number, annualRate: number, tenureMonths: number): {
  downpayment: number;
  financedPrincipal: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
} {
  const downpayment = 0;
  const financedPrincipal = fullPrice;
  if (annualRate <= 0) {
    const monthlyEmi = Math.round(financedPrincipal / tenureMonths);
    const totalPayable = monthlyEmi * tenureMonths;
    return { downpayment, financedPrincipal, monthlyEmi, totalInterest: 0, totalPayable };
  }
  const monthlyRate = annualRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEmi = Math.round((financedPrincipal * monthlyRate * factor) / (factor - 1));
  const totalPayable = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalPayable - financedPrincipal);
  return { downpayment, financedPrincipal, monthlyEmi, totalInterest, totalPayable };
}

function generateEmiPlans(productId: string, price: number): EmiPlan[] {
  const tenures = [
    { m: 3, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'ICICI Prudential Liquid Fund' },
    { m: 6, rate: 0.0, cash: 7500, noCost: 1, pop: 1, mf: 'ICICI Prudential Liquid Fund' },
    { m: 12, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'SBI Liquid Fund Growth' },
    { m: 24, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'ICICI Prudential Liquid Fund' },
    { m: 36, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'HDFC Overnight Fund' },
    { m: 48, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'Aditya Birla Sun Life Liquid' },
    { m: 60, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'SBI Liquid Fund Growth' }
  ];

  return tenures.map(t => {
    const calc = computeEmi(price, t.rate, t.m);
    const tenureYears = t.m / 12;
    const mfProjectedReturn = Math.round(price * (Math.pow(1 + (7.2 / 100), tenureYears) - 1));
    const netEffectiveCost = Math.max(0, calc.totalPayable - t.cash - mfProjectedReturn);
    return {
      id: `plan-${t.m}m`,
      product_id: productId,
      tenure_months: t.m,
      interest_rate: t.rate,
      downpayment_amount: 0,
      processing_fee: 0,
      cashback_amount: t.cash,
      cashback_description: `Additional cashback of ₹${t.cash.toLocaleString('en-IN')}`,
      is_no_cost: t.noCost,
      is_popular: t.pop,
      mutual_fund_id: 'mf-icici-liquid',
      mf_name: t.mf,
      mf_amc: 'ICICI Prudential AMC',
      mf_nav: 362.15,
      mf_cagr: 7.2,
      mf_risk: 'Low Risk',
      mf_rating: 5,
      calculated: {
        principal: price,
        downpayment: 0,
        financedPrincipal: price,
        monthly_emi: calc.monthlyEmi,
        total_interest: calc.totalInterest,
        total_payable: calc.totalPayable,
        cashback_amount: t.cash,
        net_payable_after_cashback: calc.totalPayable - t.cash,
        mf_projected_return: mfProjectedReturn,
        net_effective_cost: netEffectiveCost,
        interest_fully_offset_by_mf: true
      }
    };
  });
}

export const FALLBACK_IPHONE: Product = {
  id: '1',
  slug: 'iphone-17-pro',
  name: 'Apple iPhone 17 Pro',
  brand: 'Apple',
  tagline: 'Precision-milled aerospace titanium with next-generation A19 Pro silicon.',
  description: 'Experience the cutting-edge Apple iPhone 17 Pro featuring the revolutionary A19 Pro chip, custom ceramic shield front, 120Hz ProMotion Super Retina XDR display, and 48MP quad-lens fusion camera system with 5x telephoto optical zoom. Backed by 1Fi Mutual Fund collateral for zero-cost financing.',
  category: 'Smartphones',
  rating: 4.8,
  reviews_count: 1420,
  base_price: 132900,
  base_mrp: 139900,
  default_image: '/images/iphone-17-pro-orange-1.jpg',
  highlights: [
    'Storage: 256GB',
    'Color: Cosmic Orange',
    'Super Retina XDR Display with ProMotion 120Hz',
    '0% Interest Smart EMI backed by mutual funds',
    'Additional cashback on selected tenures'
  ],
  specs: {
    'Display': 'Super Retina XDR 120Hz OLED Display',
    'Processor': 'Apple A19 Pro Silicon (3nm architecture)',
    'Storage': '256GB',
    'Color': 'Cosmic Orange'
  },
  variants: [
    // Cosmic Orange
    {
      id: '9',
      product_id: '1',
      name: 'Cosmic Orange / 256GB',
      color_name: 'Cosmic Orange',
      color_hex: '#E46D29',
      storage: '256GB',
      price: 132900,
      mrp: 139900,
      image_url: '/images/iphone-17-pro-orange-1.jpg',
      gallery_images: [
        '/images/iphone-17-pro-orange-1.jpg',
        '/images/iphone-17-pro-orange-2.jpg',
        '/images/iphone-17-pro-orange-3.jpg',
        '/images/iphone-17-pro-orange-4.jpg',
        '/images/iphone-17-pro-orange-5.jpg'
      ],
      in_stock: 1,
      stock_quantity: 18
    },
    {
      id: '10',
      product_id: '1',
      name: 'Cosmic Orange / 512GB',
      color_name: 'Cosmic Orange',
      color_hex: '#E46D29',
      storage: '512GB',
      price: 152900,
      mrp: 159900,
      image_url: '/images/iphone-17-pro-orange-1.jpg',
      gallery_images: [
        '/images/iphone-17-pro-orange-1.jpg',
        '/images/iphone-17-pro-orange-2.jpg',
        '/images/iphone-17-pro-orange-3.jpg',
        '/images/iphone-17-pro-orange-4.jpg',
        '/images/iphone-17-pro-orange-5.jpg'
      ],
      in_stock: 1,
      stock_quantity: 12
    },
    {
      id: '11',
      product_id: '1',
      name: 'Cosmic Orange / 1TB',
      color_name: 'Cosmic Orange',
      color_hex: '#E46D29',
      storage: '1TB',
      price: 172900,
      mrp: 179900,
      image_url: '/images/iphone-17-pro-orange-1.jpg',
      gallery_images: [
        '/images/iphone-17-pro-orange-1.jpg',
        '/images/iphone-17-pro-orange-2.jpg',
        '/images/iphone-17-pro-orange-3.jpg',
        '/images/iphone-17-pro-orange-4.jpg',
        '/images/iphone-17-pro-orange-5.jpg'
      ],
      in_stock: 1,
      stock_quantity: 8
    },
    // Silver
    {
      id: '12',
      product_id: '1',
      name: 'Silver / 256GB',
      color_name: 'Silver',
      color_hex: '#E2E4E1',
      storage: '256GB',
      price: 127900,
      mrp: 134900,
      image_url: '/images/iphone-17-pro-silver-1.png',
      gallery_images: [
        '/images/iphone-17-pro-silver-1.png',
        '/images/iphone-17-pro-silver-2.png',
        '/images/iphone-17-pro-silver-3.png',
        '/images/iphone-17-pro-silver-4.png',
        '/images/iphone-17-pro-silver-5.png'
      ],
      in_stock: 1,
      stock_quantity: 22
    },
    {
      id: '13',
      product_id: '1',
      name: 'Silver / 512GB',
      color_name: 'Silver',
      color_hex: '#E2E4E1',
      storage: '512GB',
      price: 147900,
      mrp: 154900,
      image_url: '/images/iphone-17-pro-silver-1.png',
      gallery_images: [
        '/images/iphone-17-pro-silver-1.png',
        '/images/iphone-17-pro-silver-2.png',
        '/images/iphone-17-pro-silver-3.png',
        '/images/iphone-17-pro-silver-4.png',
        '/images/iphone-17-pro-silver-5.png'
      ],
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: '14',
      product_id: '1',
      name: 'Silver / 1TB',
      color_name: 'Silver',
      color_hex: '#E2E4E1',
      storage: '1TB',
      price: 167900,
      mrp: 174900,
      image_url: '/images/iphone-17-pro-silver-1.png',
      gallery_images: [
        '/images/iphone-17-pro-silver-1.png',
        '/images/iphone-17-pro-silver-2.png',
        '/images/iphone-17-pro-silver-3.png',
        '/images/iphone-17-pro-silver-4.png',
        '/images/iphone-17-pro-silver-5.png'
      ],
      in_stock: 1,
      stock_quantity: 9
    },
    // Deep Blue
    {
      id: '15',
      product_id: '1',
      name: 'Deep Blue / 256GB',
      color_name: 'Deep Blue',
      color_hex: '#2E3D52',
      storage: '256GB',
      price: 129900,
      mrp: 136900,
      image_url: '/images/iphone-17-pro-blue-1.png',
      gallery_images: [
        '/images/iphone-17-pro-blue-1.png',
        '/images/iphone-17-pro-blue-2.jpg',
        '/images/iphone-17-pro-blue-3.png',
        '/images/iphone-17-pro-blue-4.png',
        '/images/iphone-17-pro-blue-5.png'
      ],
      in_stock: 1,
      stock_quantity: 20
    },
    {
      id: '16',
      product_id: '1',
      name: 'Deep Blue / 512GB',
      color_name: 'Deep Blue',
      color_hex: '#2E3D52',
      storage: '512GB',
      price: 149900,
      mrp: 156900,
      image_url: '/images/iphone-17-pro-blue-1.png',
      gallery_images: [
        '/images/iphone-17-pro-blue-1.png',
        '/images/iphone-17-pro-blue-2.jpg',
        '/images/iphone-17-pro-blue-3.png',
        '/images/iphone-17-pro-blue-4.png',
        '/images/iphone-17-pro-blue-5.png'
      ],
      in_stock: 1,
      stock_quantity: 14
    },
    {
      id: '17',
      product_id: '1',
      name: 'Deep Blue / 1TB',
      color_name: 'Deep Blue',
      color_hex: '#2E3D52',
      storage: '1TB',
      price: 169900,
      mrp: 176900,
      image_url: '/images/iphone-17-pro-blue-1.png',
      gallery_images: [
        '/images/iphone-17-pro-blue-1.png',
        '/images/iphone-17-pro-blue-2.jpg',
        '/images/iphone-17-pro-blue-3.png',
        '/images/iphone-17-pro-blue-4.png',
        '/images/iphone-17-pro-blue-5.png'
      ],
      in_stock: 1,
      stock_quantity: 7
    }
  ],
  emi_plans: generateEmiPlans('1', 132900)
};

export const FALLBACK_SAMSUNG: Product = {
  id: '2',
  slug: 'samsung-s24-ultra',
  name: 'Samsung Galaxy S24 Ultra',
  brand: 'Samsung',
  tagline: 'Galaxy AI is here. Encased in durable titanium with built-in S-Pen.',
  description: 'The pinnacle of Android craftsmanship. Samsung Galaxy S24 Ultra brings a flat 6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, titanium frame, 200MP camera system, and integrated S Pen for precision productivity.',
  category: 'Smartphones',
  rating: 4.8,
  reviews_count: 1420,
  base_price: 117999,
  base_mrp: 132999,
  default_image: '/images/s24-ultra-black-1.png',
  highlights: [
    'Snapdragon 8 Gen 3 for Galaxy with Vapor Chamber Cooling',
    '6.8-inch QHD+ Dynamic AMOLED 2X, 2600 nits peak brightness',
    'Titanium frame with Corning Gorilla Armor anti-reflective glass',
    '200MP Quad Telephoto Camera with ProVisual AI Engine',
    'Built-in S Pen stylus with Air Actions & live translation'
  ],
  specs: {
    'Display': '6.8-inch Dynamic AMOLED 2X',
    'Processor': 'Qualcomm Snapdragon 8 Gen 3 for Galaxy',
    'Rear Camera': '200MP + 50MP + 10MP + 12MP',
    'Battery': '5,000 mAh with 45W Fast Charging'
  },
  variants: [
    {
      id: '18',
      product_id: '2',
      name: 'Titanium Black / 256GB',
      color_name: 'Titanium Black',
      color_hex: '#222324',
      storage: '256GB',
      price: 119999,
      mrp: 134999,
      image_url: '/images/s24-ultra-black-1.png',
      gallery_images: [
        '/images/s24-ultra-black-1.png',
        '/images/s24-ultra-black-2.png',
        '/images/s24-ultra-black-3.png',
        '/images/s24-ultra-black-4.png',
        '/images/s24-ultra-black-5.png'
      ],
      in_stock: 1,
      stock_quantity: 16
    },
    {
      id: '19',
      product_id: '2',
      name: 'Titanium Black / 512GB',
      color_name: 'Titanium Black',
      color_hex: '#222324',
      storage: '512GB',
      price: 129999,
      mrp: 144999,
      image_url: '/images/s24-ultra-black-1.png',
      gallery_images: [
        '/images/s24-ultra-black-1.png',
        '/images/s24-ultra-black-2.png',
        '/images/s24-ultra-black-3.png',
        '/images/s24-ultra-black-4.png',
        '/images/s24-ultra-black-5.png'
      ],
      in_stock: 1,
      stock_quantity: 11
    },
    {
      id: '20',
      product_id: '2',
      name: 'Titanium Gray / 256GB',
      color_name: 'Titanium Gray',
      color_hex: '#686B6F',
      storage: '256GB',
      price: 117999,
      mrp: 132999,
      image_url: '/images/s24-ultra-1.svg',
      gallery_images: [
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ],
      in_stock: 1,
      stock_quantity: 19
    },
    {
      id: '21',
      product_id: '2',
      name: 'Titanium Gray / 512GB',
      color_name: 'Titanium Gray',
      color_hex: '#686B6F',
      storage: '512GB',
      price: 127999,
      mrp: 142999,
      image_url: '/images/s24-ultra-1.svg',
      gallery_images: [
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ],
      in_stock: 1,
      stock_quantity: 12
    },
    {
      id: '22',
      product_id: '2',
      name: 'Titanium Violet / 256GB',
      color_name: 'Titanium Violet',
      color_hex: '#5F5170',
      storage: '256GB',
      price: 118999,
      mrp: 133999,
      image_url: '/images/s24-ultra-2.svg',
      gallery_images: [
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ],
      in_stock: 1,
      stock_quantity: 14
    },
    {
      id: '23',
      product_id: '2',
      name: 'Titanium Violet / 512GB',
      color_name: 'Titanium Violet',
      color_hex: '#5F5170',
      storage: '512GB',
      price: 128999,
      mrp: 143999,
      image_url: '/images/s24-ultra-2.svg',
      gallery_images: [
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ],
      in_stock: 1,
      stock_quantity: 8
    }
  ],
  emi_plans: generateEmiPlans('2', 117999)
};

export const FALLBACK_PRODUCTS_LIST: Product[] = [
  {
    ...FALLBACK_IPHONE,
    variants_count: 9,
    lowest_emi: 10658,
    save_amount: 7000
  },
  {
    ...FALLBACK_SAMSUNG,
    variants_count: 6,
    lowest_emi: 9833,
    save_amount: 15000
  }
];

export function getFallbackProduct(slugOrId: string): Product {
  const norm = slugOrId.toLowerCase();
  if (norm.includes('samsung') || norm.includes('s24') || norm === '2') {
    return FALLBACK_SAMSUNG;
  }
  return FALLBACK_IPHONE;
}

export function recalculateFallbackEmi(price: number): EmiPlan[] {
  return generateEmiPlans('dynamic', price);
}
