import React, { useState } from 'react';
import { Search, Database, HelpCircle } from 'lucide-react';
import { Product } from '../types.ts';

interface HeaderProps {
  products: Product[];
  currentProductSlug: string;
  onSelectProduct: (slug: string) => void;
  onOpenDbModal: () => void;
  onOpenHowItWorks: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  currentUser?: { name: string; phone: string } | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  currentProductSlug,
  onSelectProduct,
  onOpenDbModal,
  onOpenHowItWorks,
  onOpenAuth,
  currentUser,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Mobiles');

  const categories = [
    'Deals',
    'Mobiles',
    'Electronics',
    'TV/AC & Appliances',
    'Kitchen & Home',
    'Health & Wellness',
    'Fashion'
  ];

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-40 glass-header border-b border-white/20 shadow-sm">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-6">
          
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer select-none flex-shrink-0"
            onClick={() => products.length > 0 && onSelectProduct(products[0].slug)}
          >
            <span className="text-2xl font-black tracking-tight text-gray-900 hover:text-[#ff5e00] transition-colors">
              1fi
            </span>
          </div>

          {/* Interactive Search Bar */}
          <div className="flex-1 max-w-lg relative hidden md:block">
            <div className="relative flex items-center rounded-md shadow-sm">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                id="header-search-input"
                type="text"
                placeholder="Search for TV, mobiles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 220)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-md text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:border-[#ff5e00] focus:ring-2 focus:ring-[#ff5e00]/20 focus:shadow-md transition-colors"
              />
            </div>

            {/* Live Search Suggestions Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-sm z-50 overflow-hidden divide-y divide-gray-100 shadow-lifted animate-fadeInUp">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Products ({searchResults.length})
                </div>
                {searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    onMouseDown={() => onSelectProduct(prod.slug)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white p-1 flex items-center justify-center flex-shrink-0 border border-gray-100 rounded-md">
                        <img src={prod.default_image} alt={prod.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#ff5e00] transition-colors">{prod.name}</p>
                        <p className="text-xs text-gray-500">₹{prod.base_price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-gray-600">

            {/* DB Inspector Action */}
            <button
              id="header-db-inspector-btn"
              onClick={onOpenDbModal}
              title="DB Schema"
              className="hidden lg:flex items-center gap-1.5 text-gray-600 hover:text-[#ff5e00] transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>DB Schema</span>
            </button>

            {/* How It Works Action */}
            <button
              id="header-how-it-works-btn"
              onClick={onOpenHowItWorks}
              className="flex items-center gap-1.5 text-gray-600 hover:text-[#ff5e00] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            <a href="#" className="hidden md:inline hover:text-[#ff5e00] transition-all cursor-pointer">
              For Business
            </a>
            
            <a href="#" className="hidden md:inline hover:text-[#ff5e00] transition-all cursor-pointer">
              Pay EMI
            </a>

            {/* Auth Actions */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-md text-xs font-semibold text-gray-800">
                  <div className="w-5 h-5 rounded-full bg-[#ff5e00] text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="header-signin-btn"
                  onClick={() => onOpenAuth('signin')}
                  className="hidden sm:inline px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-[#ff5e00] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="header-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 btn-gradient hover:shadow-lg animate-pulseGlow text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navbar: Categories Bar */}
      <div className="border-t border-gray-100 bg-white/80 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 text-sm whitespace-nowrap">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`py-3 transition-all cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-[#ff5e00] text-[#1a1a1a] font-semibold'
                      : 'border-b-2 border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
