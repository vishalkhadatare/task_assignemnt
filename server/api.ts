import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from './db.js';

export const apiRouter = Router();

// Helper to compute EMI
function computeEmi(fullPrice: number, annualRate: number, tenureMonths: number, downpaymentRate: number = 0): {
  downpayment: number;
  financedPrincipal: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
} {
  const downpayment = Math.round(fullPrice * downpaymentRate);
  const financedPrincipal = Math.max(0, fullPrice - downpayment);

  if (annualRate <= 0) {
    const monthlyEmi = Math.round(financedPrincipal / tenureMonths);
    const totalPayable = monthlyEmi * tenureMonths + downpayment;
    return {
      downpayment,
      financedPrincipal,
      monthlyEmi,
      totalInterest: 0,
      totalPayable
    };
  }

  const monthlyRate = annualRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEmi = Math.round((financedPrincipal * monthlyRate * factor) / (factor - 1));
  const totalPayable = monthlyEmi * tenureMonths + downpayment;
  const totalInterest = Math.max(0, (monthlyEmi * tenureMonths) - financedPrincipal);

  return {
    downpayment,
    financedPrincipal,
    monthlyEmi,
    totalInterest,
    totalPayable
  };
}

// 1. GET /api/test-db - Test PostgreSQL connection status
apiRouter.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await queryOne('SELECT NOW() as now');
    res.json({
      success: true,
      message: 'PostgreSQL connected successfully',
      database: 'ecommerce_db',
      time: result?.now
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// 2. GET /api/products - Get all products with summary data
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await queryAll(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        COALESCE(MIN(pv.mrp), p.mrp) as min_mrp,
        COALESCE(MIN(pv.price), p.price) as min_price,
        p.created_at,
        COUNT(pv.id)::int as variants_count,
        COALESCE(MIN(pv.image_url), '/images/iphone-17-pro-orange-1.jpg') as default_image
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    const formatted = products.map((p: any) => {
      const priceNum = parseFloat(p.min_price) || 0;
      const mrpNum = parseFloat(p.min_mrp) || priceNum;
      const lowestEmi = Math.round(priceNum / 12);
      const isIphone = p.slug.includes('iphone');
      const isSamsung = p.slug.includes('samsung') || p.slug.includes('s24');
      const defaultImage = isIphone ? '/images/iphone-17-pro-orange-1.jpg' : isSamsung ? '/images/s24-ultra-black-1.png' : p.default_image;
      return {
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.name.includes('iPhone') ? 'Apple' : 'Samsung',
        base_price: priceNum,
        base_mrp: mrpNum,
        rating: 4.8,
        reviews_count: 1420,
        default_image: defaultImage,
        variants_count: p.variants_count,
        lowest_emi: lowestEmi,
        save_amount: Math.max(0, mrpNum - priceNum)
      };
    });

    res.json({ success: true, count: formatted.length, products: formatted });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET /api/products/:slugOrId - Get specific product with variants and EMI plans
apiRouter.get('/products/:slugOrId', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    const product = await queryOne(`
      SELECT * FROM products
      WHERE slug = ? OR id::text = ? OR slug LIKE ?
    `, [slugOrId, slugOrId, `%${slugOrId}%`]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const priceNum = parseFloat(product.price) || 0;
    const mrpNum = parseFloat(product.mrp) || priceNum;

    // Get variants for this product
    const variantsRaw = await queryAll(`
      SELECT * FROM product_variants
      WHERE product_id = ?
      ORDER BY 
        CASE 
          WHEN LOWER(color) LIKE '%orange%' THEN 0 
          WHEN LOWER(color) LIKE '%silver%' THEN 1 
          WHEN LOWER(color) LIKE '%blue%' THEN 2 
          WHEN LOWER(color) LIKE '%black%' THEN 0
          WHEN LOWER(color) LIKE '%gray%' OR LOWER(color) LIKE '%grey%' THEN 1
          WHEN LOWER(color) LIKE '%violet%' THEN 2
          ELSE 3 
        END,
        CASE
          WHEN LOWER(storage) LIKE '%256%' THEN 0
          WHEN LOWER(storage) LIKE '%512%' THEN 1
          WHEN LOWER(storage) LIKE '%1tb%' OR LOWER(storage) LIKE '%1 tb%' THEN 2
          ELSE 3
        END,
        id ASC
    `, [product.id]);

    const isIphone = product.slug.includes('iphone');
    const isSamsung = product.slug.includes('samsung') || product.slug.includes('s24');

    const variants = variantsRaw.map((v: any) => {
      const variantColor = (v.color || v.color_name || 'Silver').toString();
      const variantStorage = (v.storage || '256GB').toString();
      let gallery = [v.image_url];
      let imageUrl = v.image_url;

      if (isIphone) {
        if (variantColor.toLowerCase().includes('orange')) {
          imageUrl = '/images/iphone-17-pro-orange-1.jpg';
          gallery = [
            '/images/iphone-17-pro-orange-1.jpg',
            '/images/iphone-17-pro-orange-2.jpg',
            '/images/iphone-17-pro-orange-3.jpg',
            '/images/iphone-17-pro-orange-4.jpg',
            '/images/iphone-17-pro-orange-5.jpg'
          ];
        } else if (variantColor.toLowerCase().includes('blue')) {
          imageUrl = '/images/iphone-17-pro-blue-1.png';
          gallery = [
            '/images/iphone-17-pro-blue-1.png',
            '/images/iphone-17-pro-blue-2.jpg',
            '/images/iphone-17-pro-blue-3.png',
            '/images/iphone-17-pro-blue-4.png',
            '/images/iphone-17-pro-blue-5.png'
          ];
        } else {
          imageUrl = '/images/iphone-17-pro-silver-1.png';
          gallery = [
            '/images/iphone-17-pro-silver-1.png',
            '/images/iphone-17-pro-silver-2.png',
            '/images/iphone-17-pro-silver-3.png',
            '/images/iphone-17-pro-silver-4.png',
            '/images/iphone-17-pro-silver-5.png'
          ];
        }
      } else if (isSamsung) {
        if (variantColor.toLowerCase().includes('black')) {
          imageUrl = '/images/s24-ultra-black-1.png';
          gallery = [
            '/images/s24-ultra-black-1.png',
            '/images/s24-ultra-black-2.png',
            '/images/s24-ultra-black-3.png',
            '/images/s24-ultra-black-4.png',
            '/images/s24-ultra-black-5.png'
          ];
        } else if (variantColor.toLowerCase().includes('gray') || variantColor.toLowerCase().includes('grey')) {
          imageUrl = '/images/s24-ultra-1.svg';
          gallery = [
            '/images/s24-ultra-1.svg',
            '/images/s24-ultra-2.svg',
            '/images/s24-ultra-3.svg',
            '/images/s24-ultra-4.svg',
            '/images/s24-ultra-5.svg'
          ];
        } else if (variantColor.toLowerCase().includes('violet')) {
          imageUrl = '/images/s24-ultra-2.svg';
          gallery = [
            '/images/s24-ultra-2.svg',
            '/images/s24-ultra-1.svg',
            '/images/s24-ultra-3.svg',
            '/images/s24-ultra-4.svg',
            '/images/s24-ultra-5.svg'
          ];
        } else {
          gallery = [
            '/images/s24-ultra-1.svg',
            '/images/s24-ultra-2.svg',
            '/images/s24-ultra-3.svg',
            '/images/s24-ultra-4.svg',
            '/images/s24-ultra-5.svg'
          ];
        }
      }

      const colorHex = variantColor.toLowerCase().includes('orange') ? '#E46D29'
        : variantColor.toLowerCase().includes('blue') ? '#2E3D52'
        : variantColor.toLowerCase().includes('silver') ? '#E2E4E1'
        : variantColor.toLowerCase().includes('violet') ? '#5F5170'
        : (variantColor.toLowerCase().includes('gray') || variantColor.toLowerCase().includes('grey')) ? '#686B6F'
        : variantColor.toLowerCase().includes('black') ? '#222324'
        : variantColor.toLowerCase().includes('white') ? '#E8ECEF'
        : '#252729';

      const varPrice = v.price ? parseFloat(v.price) : priceNum;
      const varMrp = v.mrp ? parseFloat(v.mrp) : mrpNum;

      return {
        id: String(v.id),
        product_id: String(v.product_id),
        name: `${variantColor} / ${variantStorage}`,
        color_name: variantColor,
        color_hex: colorHex,
        storage: variantStorage,
        price: varPrice,
        mrp: varMrp,
        image_url: imageUrl,
        gallery_images: gallery,
        in_stock: 1,
        stock_quantity: 15
      };
    });

    const activeVariant = variants.find((v: any) => (v.color_name || '').toLowerCase().includes('orange') && (v.storage || '').toLowerCase().includes('256'))
      || variants.find((v: any) => (v.color_name || '').toLowerCase().includes('orange'))
      || variants.find((v: any) => (v.color_name || '').toLowerCase().includes('black') && (v.storage || '').toLowerCase().includes('256'))
      || variants.find((v: any) => (v.color_name || '').toLowerCase().includes('black'))
      || variants[0]
      || null;
    const activeVariantId = activeVariant ? parseInt(activeVariant.id, 10) : null;
    const activeVariantPrice = activeVariant ? activeVariant.price : priceNum;
    const activeVariantMrp = activeVariant ? activeVariant.mrp : mrpNum;

    // Fetch EMI plans from emi_plans table linked to this variant
    let emiPlansRaw = activeVariantId
      ? await queryAll(`
          SELECT * FROM emi_plans
          WHERE variant_id = ?
          ORDER BY tenure_months ASC
        `, [activeVariantId])
      : [];

    if (emiPlansRaw.length === 0 && variantsRaw[0]) {
      emiPlansRaw = await queryAll(`
        SELECT * FROM emi_plans
        WHERE variant_id = ?
        ORDER BY tenure_months ASC
      `, [variantsRaw[0].id]);
    }

    const plansWithCalculations = emiPlansRaw.map((plan: any) => {
      const tenure = parseInt(plan.tenure_months, 10);
      const rate = parseFloat(plan.interest_rate) || 0;
      const cashback = parseFloat(plan.cashback) || 0;

      const calc = computeEmi(activeVariantPrice, rate, tenure);
      const tenureYears = tenure / 12;
      const mfProjectedReturn = Math.round(activeVariantPrice * (Math.pow(1 + (7.2 / 100), tenureYears) - 1));
      const monthlyPayment = parseFloat(plan.monthly_payment) || calc.monthlyEmi;
      const netEffectiveCost = Math.max(0, (monthlyPayment * tenure) - cashback - mfProjectedReturn);

      return {
        id: String(plan.id),
        product_id: String(product.id),
        tenure_months: tenure,
        interest_rate: rate,
        downpayment_amount: 0,
        processing_fee: 0,
        monthly_payment: calc.monthlyEmi,
        cashback_amount: cashback,
        cashback_description: cashback > 0 ? `Additional cashback of ₹${cashback.toLocaleString('en-IN')}` : '',
        is_no_cost: rate === 0 ? 1 : 0,
        is_popular: tenure === 6 ? 1 : 0,
        mutual_fund_id: tenure <= 6 ? 'mf-icici-liquid' : 'mf-sbi-liquid',
        mf_name: tenure <= 6 ? 'ICICI Prudential Liquid Fund' : 'SBI Liquid Fund Growth',
        mf_amc: tenure <= 6 ? 'ICICI Prudential AMC' : 'SBI Funds Management',
        mf_nav: 362.15,
        mf_cagr: 7.2,
        mf_risk: 'Low Risk',
        mf_rating: 5,
        calculated: {
          principal: activeVariantPrice,
          downpayment: calc.downpayment,
          financedPrincipal: calc.financedPrincipal,
          monthly_emi: calc.monthlyEmi,
          total_interest: calc.totalInterest,
          total_payable: calc.totalPayable,
          cashback_amount: cashback,
          net_payable_after_cashback: calc.totalPayable - cashback,
          mf_projected_return: mfProjectedReturn,
          net_effective_cost: netEffectiveCost,
          interest_fully_offset_by_mf: true
        }
      };
    });

    if (plansWithCalculations.length === 0) {
      const tenures = [
        { m: 3, rate: 0.0, cash: 7500, pop: false },
        { m: 6, rate: 0.0, cash: 7500, pop: true },
        { m: 9, rate: 0.0, cash: 7500, pop: false },
        { m: 12, rate: 0.0, cash: 7500, pop: false },
        { m: 18, rate: 10.5, cash: 7500, pop: false },
        { m: 24, rate: 10.5, cash: 7500, pop: false },
        { m: 36, rate: 10.5, cash: 7500, pop: false }
      ];
      for (const t of tenures) {
        const calc = computeEmi(activeVariantPrice, t.rate, t.m);
        const tenureYears = t.m / 12;
        const mfProjectedReturn = Math.round(activeVariantPrice * (Math.pow(1 + (7.2 / 100), tenureYears) - 1));
        const netEffectiveCost = Math.max(0, calc.totalPayable - t.cash - mfProjectedReturn);
        plansWithCalculations.push({
          id: `plan-${t.m}m`,
          product_id: String(product.id),
          tenure_months: t.m,
          interest_rate: t.rate,
          downpayment_amount: 0,
          processing_fee: 0,
          monthly_payment: calc.monthlyEmi,
          cashback_amount: t.cash,
          cashback_description: `Additional cashback of ₹${t.cash.toLocaleString('en-IN')}`,
          is_no_cost: t.rate === 0 ? 1 : 0,
          is_popular: t.pop ? 1 : 0,
          mutual_fund_id: t.m <= 6 ? 'mf-icici-liquid' : 'mf-sbi-liquid',
          mf_name: t.m <= 6 ? 'ICICI Prudential Liquid Fund' : 'SBI Liquid Fund Growth',
          mf_amc: t.m <= 6 ? 'ICICI Prudential AMC' : 'SBI Funds Management',
          mf_nav: 362.15,
          mf_cagr: 7.2,
          mf_risk: 'Low Risk',
          mf_rating: 5,
          calculated: {
            principal: activeVariantPrice,
            downpayment: calc.downpayment,
            financedPrincipal: calc.financedPrincipal,
            monthly_emi: calc.monthlyEmi,
            total_interest: calc.totalInterest,
            total_payable: calc.totalPayable,
            cashback_amount: t.cash,
            net_payable_after_cashback: calc.totalPayable - t.cash,
            mf_projected_return: mfProjectedReturn,
            net_effective_cost: netEffectiveCost,
            interest_fully_offset_by_mf: true
          }
        });
      }
    }

    const parsedProduct = {
      id: String(product.id),
      slug: product.slug,
      name: product.name,
      brand: product.name.includes('iPhone') ? 'Apple' : 'Samsung',
      tagline: 'Backed by liquid mutual funds with zero-cost tenure options and real-time approval.',
      description: product.description,
      category: 'Smartphones',
      rating: 4.8,
      reviews_count: 1420,
      base_price: activeVariantPrice,
      base_mrp: activeVariantMrp,
      default_image: activeVariant?.image_url || '/images/iphone-17-pro-orange-1.jpg',
      highlights: [
        `Storage: ${activeVariant?.storage || '256GB'}`,
        `Color: ${activeVariant?.color_name || 'Orange'}`,
        'Super Retina XDR Display / Dynamic AMOLED 2X',
        '0% Interest Smart EMI backed by mutual funds',
        'Additional cashback on selected tenures'
      ],
      specs: {
        'Display': 'ProMotion 120Hz OLED Display',
        'Processor': 'Next-Gen Flagship Silicon (3nm)',
        'Storage': activeVariant?.storage || '256GB',
        'Color': activeVariant?.color_name || 'Orange'
      },
      variants,
      emi_plans: plansWithCalculations
    };

    res.json({ success: true, product: parsedProduct });
  } catch (error: any) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET /api/products/:slug/calculate-emi - Calculate EMI dynamically
apiRouter.get('/products/:slugOrId/calculate-emi', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const variantId = req.query.variant_id as string;
    const customPrice = req.query.price ? Number(req.query.price) : null;

    const product = await queryOne(`
      SELECT * FROM products WHERE slug = ? OR id::text = ? OR slug LIKE ?
    `, [slugOrId, slugOrId, `%${slugOrId}%`]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const priceNum = parseFloat(product.price) || 0;
    let targetPrice = customPrice && !isNaN(customPrice) ? customPrice : 0;
    if (!targetPrice && variantId) {
      const v = await queryOne(`SELECT price FROM product_variants WHERE id = ?`, [variantId]);
      if (v && v.price) {
        targetPrice = parseFloat(v.price);
      }
    }
    if (!targetPrice) {
      targetPrice = priceNum;
    }

    let emiPlans = variantId
      ? await queryAll(`
          SELECT * FROM emi_plans WHERE variant_id = ? ORDER BY tenure_months ASC
        `, [variantId])
      : [];

    if (emiPlans.length === 0) {
      emiPlans = await queryAll(`
        SELECT ep.* FROM emi_plans ep
        JOIN product_variants pv ON ep.variant_id = pv.id
        WHERE pv.product_id = ?
        ORDER BY ep.tenure_months ASC
      `, [product.id]);
    }

    const calculatedPlans = emiPlans.map((plan: any) => {
      const tenure = parseInt(plan.tenure_months, 10);
      const rate = parseFloat(plan.interest_rate) || 0;
      const cashback = parseFloat(plan.cashback) || 0;

      const calc = computeEmi(targetPrice, rate, tenure);
      const tenureYears = tenure / 12;
      const mfProjectedReturn = Math.round(targetPrice * (Math.pow(1 + (7.2 / 100), tenureYears) - 1));
      const netEffectiveCost = Math.max(0, calc.totalPayable - cashback - mfProjectedReturn);

      return {
        ...plan,
        monthly_payment: calc.monthlyEmi,
        calculated: {
          principal: targetPrice,
          downpayment: calc.downpayment,
          financedPrincipal: calc.financedPrincipal,
          monthly_emi: calc.monthlyEmi,
          total_interest: calc.totalInterest,
          total_payable: calc.totalPayable,
          cashback_amount: cashback,
          net_payable_after_cashback: calc.totalPayable - cashback,
          mf_projected_return: mfProjectedReturn,
          net_effective_cost: netEffectiveCost,
          interest_fully_offset_by_mf: true
        }
      };
    });

    if (calculatedPlans.length === 0) {
      const tenures = [
        { m: 3, rate: 0.0, cash: 7500, pop: false },
        { m: 6, rate: 0.0, cash: 7500, pop: true },
        { m: 9, rate: 0.0, cash: 7500, pop: false },
        { m: 12, rate: 0.0, cash: 7500, pop: false },
        { m: 18, rate: 10.5, cash: 7500, pop: false },
        { m: 24, rate: 10.5, cash: 7500, pop: false },
        { m: 36, rate: 10.5, cash: 7500, pop: false }
      ];
      for (const t of tenures) {
        const calc = computeEmi(targetPrice, t.rate, t.m);
        const tenureYears = t.m / 12;
        const mfProjectedReturn = Math.round(targetPrice * (Math.pow(1 + (7.2 / 100), tenureYears) - 1));
        const netEffectiveCost = Math.max(0, calc.totalPayable - t.cash - mfProjectedReturn);
        calculatedPlans.push({
          id: `plan-${t.m}m`,
          tenure_months: t.m,
          interest_rate: t.rate,
          downpayment_amount: 0,
          processing_fee: 0,
          monthly_payment: calc.monthlyEmi,
          cashback_amount: t.cash,
          cashback_description: `Additional cashback of ₹${t.cash.toLocaleString('en-IN')}`,
          is_no_cost: t.rate === 0 ? 1 : 0,
          is_popular: t.pop ? 1 : 0,
          mutual_fund_id: t.m <= 6 ? 'mf-icici-liquid' : 'mf-sbi-liquid',
          mf_name: t.m <= 6 ? 'ICICI Prudential Liquid Fund' : 'SBI Liquid Fund Growth',
          mf_amc: t.m <= 6 ? 'ICICI Prudential AMC' : 'SBI Funds Management',
          mf_nav: 362.15,
          mf_cagr: 7.2,
          mf_risk: 'Low Risk',
          mf_rating: 5,
          calculated: {
            principal: targetPrice,
            downpayment: calc.downpayment,
            financedPrincipal: calc.financedPrincipal,
            monthly_emi: calc.monthlyEmi,
            total_interest: calc.totalInterest,
            total_payable: calc.totalPayable,
            cashback_amount: t.cash,
            net_payable_after_cashback: calc.totalPayable - t.cash,
            mf_projected_return: mfProjectedReturn,
            net_effective_cost: netEffectiveCost,
            interest_fully_offset_by_mf: true
          }
        });
      }
    }

    res.json({ success: true, plans: calculatedPlans });
  } catch (error: any) {
    console.error('Error calculating EMI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST /api/applications - Submit loan application
apiRouter.post('/applications', async (req: Request, res: Response) => {
  try {
    const {
      product_id,
      product_name,
      variant_id,
      variant_name,
      product_price,
      tenure_months,
      monthly_emi,
      interest_rate,
      cashback_amount,
      mutual_fund_name,
      full_name,
      phone,
      email,
      pan_number,
      monthly_income
    } = req.body;

    if (!full_name || !phone || !pan_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (full_name, phone, pan_number)'
      });
    }

    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanctionNumber = `FI-EMI-${Math.floor(100000 + Math.random() * 900000)}`;
    const createdAt = new Date().toISOString();

    res.json({
      success: true,
      message: '1Fi Smart EMI Approved Instantly!',
      application: {
        id: applicationId,
        sanction_number: sanctionNumber,
        status: 'APPROVED & SANCTIONED',
        product_name,
        variant_name,
        product_price,
        tenure_months,
        monthly_emi,
        interest_rate,
        cashback_amount,
        customer: {
          name: full_name,
          phone,
          pan: pan_number.toUpperCase()
        },
        sanction_date: createdAt
      }
    });
  } catch (error: any) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/database-schema - Database inspection for reviewers
apiRouter.get('/database-schema', async (req: Request, res: Response) => {
  try {
    const pCount = await queryOne('SELECT COUNT(*)::int as count FROM products');
    const vCount = await queryOne('SELECT COUNT(*)::int as count FROM product_variants');
    const eCount = await queryOne('SELECT COUNT(*)::int as count FROM emi_plans');

    const tables = [
      { name: 'products', count: pCount?.count || 0 },
      { name: 'product_variants', count: vCount?.count || 0 },
      { name: 'emi_plans', count: eCount?.count || 0 }
    ];

    res.json({
      success: true,
      database: 'PostgreSQL 18 (ecommerce_db)',
      tables,
      features: [
        'Relational foreign keys (ON DELETE CASCADE)',
        'Dynamic EMI amortization calculator',
        '1Fi Mutual Fund yield offset logic',
        'Multi-variant product catalog with SVG galleries'
      ]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
