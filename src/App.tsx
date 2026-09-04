import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { ProductGallery } from './components/ProductGallery.tsx';
import { ProductInfo } from './components/ProductInfo.tsx';
import { DbSchemaModal } from './components/DbSchemaModal.tsx';
import { HowItWorksModal } from './components/HowItWorksModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Product, ProductVariant, EmiPlan } from './types.ts';
import { ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

import { FALLBACK_PRODUCTS_LIST, getFallbackProduct, recalculateFallbackEmi } from './fallbackData.ts';

export default function App() {
  const [productsList, setProductsList] = useState<Product[]>(FALLBACK_PRODUCTS_LIST);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [emiPlans, setEmiPlans] = useState<EmiPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<EmiPlan | null>(null);

  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);

  // Auth & Routing state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentUser, setCurrentUser] = useState<{ name: string; phone: string; email: string } | null>(null);

  // Extract slug from URL path if present
  const getSlugFromPath = (): string => {
    const path = window.location.pathname;
    const match = path.match(/\/(?:products|p)\/([^/?#]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return '';
  };

  // 1. Initial Load: Fetch products list from API with instant resilient fallback
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        let productsData: Product[] = [];

        try {
          const res = await fetch('/api/products');
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('json')) {
            const data = await res.json();
            if (data.success && Array.isArray(data.products) && data.products.length > 0) {
              productsData = data.products;
            }
          }
        } catch (apiErr) {
          console.warn('[Catalog API Note]: Falling back to preloaded database store:', apiErr);
        }

        if (productsData.length === 0) {
          productsData = FALLBACK_PRODUCTS_LIST;
        }

        setProductsList(productsData);

        // Determine initial product slug to load
        const pathSlug = getSlugFromPath();
        let targetSlug = productsData[0]?.slug || 'iphone-17-pro';

        if (pathSlug) {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normPath = norm(pathSlug);
          const matched = productsData.find((p: Product) => {
            const normSlug = norm(p.slug);
            const normId = norm(p.id);
            const normName = norm(p.name);
            return (
              p.slug === pathSlug ||
              p.id === pathSlug ||
              normSlug.includes(normPath) ||
              normPath.includes(normSlug) ||
              normId.includes(normPath) ||
              normName.includes(normPath)
            );
          });
          if (matched) {
            targetSlug = matched.slug;
          } else {
            targetSlug = pathSlug;
          }
        }

        await loadProductDetails(targetSlug);
      } catch (err: any) {
        console.error('Error loading products:', err);
        // Ensure UI never crashes; fallback to iPhone 17 Pro
        await loadProductDetails('iphone-17-pro');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Listen for browser back/forward buttons
    const handlePopState = () => {
      const slug = getSlugFromPath();
      if (slug) {
        loadProductDetails(slug);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 2. Load product details and its initial EMI plans
  const loadProductDetails = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      let prod: Product | null = null;

      try {
        const res = await fetch(`/api/products/${slug}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('json')) {
          const data = await res.json();
          if (data.success && data.product) {
            prod = data.product as Product;
          }
        }
      } catch (apiErr) {
        console.warn(`[Product API Note for ${slug}]: Falling back to preloaded database store:`, apiErr);
      }

      if (!prod) {
        prod = getFallbackProduct(slug);
      }

      setCurrentProduct(prod);

      // Select default variant (prefer Orange 256GB if available, or first)
      const defaultVariant = prod.variants?.find((v) => v.color_name.toLowerCase().includes('orange') && v.storage.toLowerCase().includes('256'))
        || prod.variants?.find((v) => v.color_name.toLowerCase().includes('orange'))
        || prod.variants?.find((v) => v.color_name.toLowerCase().includes('black') && v.storage.toLowerCase().includes('256'))
        || prod.variants?.find((v) => v.color_name.toLowerCase().includes('black'))
        || prod.variants?.[0]
        || null;
      setSelectedVariant(defaultVariant);

      // Set initial EMI plans
      let initialPlans = (prod.emi_plans && prod.emi_plans.length > 0) ? prod.emi_plans : [];
      if (initialPlans.length === 0) {
        const fb = getFallbackProduct(slug);
        initialPlans = fb.emi_plans || [];
      }
      setEmiPlans(initialPlans);

      // Default to popular or 6-month plan
      const defaultPlan = initialPlans.find((p) => p.is_popular) || initialPlans[0] || null;
      setSelectedPlan(defaultPlan);

      // Clean browser tab title matching product
      const varInfo = defaultVariant ? ` (${defaultVariant.color_name}, ${defaultVariant.storage})` : '';
      document.title = `${prod.name}${varInfo} - Smart Phones on EMI`;

      // Update URL without page reload
      const newPath = `/products/${prod.slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ slug: prod.slug }, '', newPath);
      }
    } catch (err: any) {
      console.error('Error loading product details:', err);
      const fallback = getFallbackProduct(slug);
      setCurrentProduct(fallback);
      setSelectedVariant(fallback.variants?.[0] || null);
      setEmiPlans(fallback.emi_plans || []);
      setSelectedPlan(fallback.emi_plans?.[0] || null);
    } finally {
      setLoading(false);
    }
  };

  // 3. When variant changes, recalculate EMI dynamically from API
  const handleSelectVariant = async (variant: ProductVariant) => {
    setSelectedVariant(variant);

    if (currentProduct) {
      document.title = `${currentProduct.name} (${variant.color_name}, ${variant.storage}) - Smart Phones on EMI`;
    }

    if (!currentProduct) return;

    try {
      setPlansLoading(true);
      let updatedPlans: EmiPlan[] | null = null;

      try {
        const res = await fetch(`/api/products/${currentProduct.slug}/calculate-emi?variant_id=${variant.id}&price=${variant.price}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
            updatedPlans = data.plans;
          }
        }
      } catch (apiErr) {
        console.warn('EMI API calculation note; using client amortization engine:', apiErr);
      }

      if (!updatedPlans || updatedPlans.length === 0) {
        updatedPlans = recalculateFallbackEmi(variant.price);
      }

      setEmiPlans(updatedPlans);
      if (selectedPlan) {
        const matchingPlan = updatedPlans.find((p: EmiPlan) => p.tenure_months === selectedPlan.tenure_months);
        setSelectedPlan(matchingPlan || updatedPlans[0]);
      } else {
        setSelectedPlan(updatedPlans[0]);
      }
    } catch (err) {
      console.error('Error recalculating EMI:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  // Check for direct /signup or /signin URL navigation
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/signup') {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
    } else if (path === '/signin' || path === '/login') {
      setAuthMode('signin');
      setIsAuthModalOpen(true);
    }
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    window.history.pushState({}, '', `/${mode}`);
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
    if (currentProduct) {
      window.history.pushState({}, '', `/products/${currentProduct.slug}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const handleAuthSuccess = (userData: { name: string; phone: string; email: string }) => {
    setCurrentUser(userData);
    setIsAuthModalOpen(false);
    if (currentProduct) {
      window.history.pushState({}, '', `/products/${currentProduct.slug}`);
    }
    const tenureText = selectedPlan ? `${selectedPlan.tenure_months}-Month EMI` : 'EMI';
    setOrderToast(`Welcome, ${userData.name.split(' ')[0]}! Your ${tenureText} plan has been locked successfully.`);
    setTimeout(() => setOrderToast(null), 4500);
  };

  const handleProceedToBuy = () => {
    if (!currentUser) {
      // Suggest and open sign in page with blur background
      handleOpenAuth('signin');
    } else {
      const tenureText = selectedPlan ? `${selectedPlan.tenure_months}-Month EMI` : 'EMI';
      setOrderToast(`✓ Order confirmed for ${currentProduct?.name || 'device'} on ${tenureText}!`);
      setTimeout(() => setOrderToast(null), 4500);
    }
  };

  const handleSelectProduct = (slug: string) => {
    loadProductDetails(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !currentProduct) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#ff5e00] animate-spin" />
        <h3 className="mt-4 font-bold text-gray-900 text-base">
          Loading...
        </h3>
      </div>
    );
  }

  if (error || !currentProduct || !selectedVariant) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-md border border-gray-200 max-w-md w-full text-center shadow-sm animate-scaleIn">
          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Unable to load product</h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {error || 'Unable to retrieve product details from database.'}
          </p>
          <button
            onClick={() => productsList.length > 0 && loadProductDetails(productsList[0].slug)}
            className="mt-5 px-6 py-2.5 bg-[#ff5e00] hover:bg-[#e65500] text-white text-sm font-bold rounded-md shadow-sm transition-all cursor-pointer"
          >
            Load Apple iPhone 17 Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header
        products={productsList}
        currentProductSlug={currentProduct.slug}
        onSelectProduct={handleSelectProduct}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
        onSignOut={() => setCurrentUser(null)}
      />

      {/* Main Product Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar animate-fadeInUp">
          <span className="hover:text-[#ff5e00] cursor-pointer transition-colors">Shop on EMI</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="hover:text-[#ff5e00] cursor-pointer transition-colors">Flagship Smartphones</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="hover:text-[#ff5e00] cursor-pointer transition-colors">{currentProduct.brand}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-semibold text-gray-900 truncate">
            {currentProduct.name} ({selectedVariant.color_name}, {selectedVariant.storage})
          </span>
        </nav>

        {/* 2-Column Layout: Left column sticky, Right column natural flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start mb-6">

          {/* Left Column — sticky on desktop */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 space-y-6">
            <ProductGallery
              currentVariant={selectedVariant}
              allVariants={currentProduct.variants || []}
              onSelectVariant={handleSelectVariant}
              productName={currentProduct.name}
              rating={currentProduct.rating}
              reviewsCount={currentProduct.reviews_count}
            />
          </div>

          {/* Right Column — clean natural flow without empty space */}
          <div className="lg:col-span-5 space-y-4">
            <ProductInfo
              product={currentProduct}
              selectedVariant={selectedVariant}
              emiPlans={emiPlans}
              selectedPlan={selectedPlan}
              onSelectPlan={(plan) => setSelectedPlan(plan)}
              onProceed={handleProceedToBuy}
              onSelectVariant={handleSelectVariant}
            />
          </div>

        </div>

      </main>


      {/* Mobile Sticky Action Bar */}
      {selectedPlan && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/30 glass-mobile-bar p-3 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-900">{currentProduct.name}</p>
              <p className="text-sm font-bold text-gray-900">
                ₹{selectedPlan.calculated?.monthly_emi?.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-gray-500">/ mo</span>
              </p>
            </div>
            <button
              onClick={handleProceedToBuy}
              id="btn-buy-emi-mobile"
              className="shrink-0 rounded-md btn-gradient px-5 py-3 text-sm font-bold text-white cursor-pointer hover:shadow-lg"
            >
              Buy on EMI
            </button>
          </div>
        </div>
      )}

      {/* Modern Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-gray-100/80 border-t border-gray-200 mt-auto pt-12 pb-8 text-sm text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Footer Grid matching screenshot layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">Electronics on EMI</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#mobiles" className="hover:text-[#ff5e00] transition-colors">Smart Phones on EMI</a></li>
                <li><a href="#headphones" className="hover:text-[#ff5e00] transition-colors">Headphones on EMI</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">Kitchen & Home on EMI</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#juicers" className="hover:text-[#ff5e00] transition-colors">Juicers, Mixers & Grinders on EMI</a></li>
                <li><a href="#fans" className="hover:text-[#ff5e00] transition-colors">Fans on EMI</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">TV,AC & Appliances on EMI</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#tv" className="hover:text-[#ff5e00] transition-colors">Televisions on EMI</a></li>
                <li><a href="#fridges" className="hover:text-[#ff5e00] transition-colors">Refrigerators on EMI</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">Health & Wellness on EMI</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#protein" className="hover:text-[#ff5e00] transition-colors">Protein Supplements on EMI</a></li>
                <li><a href="#health" className="hover:text-[#ff5e00] transition-colors">Health Supplements on EMI</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <span className="font-extrabold text-base tracking-tight text-gray-900">1fi</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Mutual Fund Backed Devices Engine</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDbModalOpen(true)}
                className="text-[#ff5e00] font-bold hover:underline transition-colors cursor-pointer"
              >
                Inspect SQLite DB Schema & APIs
              </button>
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="hover:text-[#ff5e00] transition-colors cursor-pointer text-gray-600"
              >
                How Mutual Fund EMI Works
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Sign In / Sign Up Modal with Blurred Background */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuth}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
        product={currentProduct}
        variant={selectedVariant}
        plan={selectedPlan}
      />

      {/* Order / Auth Notification Toast */}
      {orderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-750 animate-fadeInUp">
          <CheckCircle2 className="w-5 h-5 text-[#ff5e00] shrink-0" />
          <span className="text-sm font-semibold">{orderToast}</span>
        </div>
      )}

      {/* Database & Schema Inspector Modal */}
      <DbSchemaModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}
