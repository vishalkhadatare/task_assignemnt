import React, { useState, useEffect } from 'react';
import { Star, Check, ChevronDown } from 'lucide-react';
import { ProductVariant } from '../types.ts';

interface ProductGalleryProps {
  currentVariant: ProductVariant;
  allVariants: ProductVariant[];
  onSelectVariant: (variant: ProductVariant) => void;
  productName: string;
  rating: number;
  reviewsCount: number;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  currentVariant,
  allVariants,
  onSelectVariant,
  productName,
  rating,
  reviewsCount,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(currentVariant.image_url);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setSelectedImage(currentVariant.image_url);
  }, [currentVariant]);

  const getHex = (cName: string, fallbackHex?: string) => {
    if (fallbackHex && fallbackHex !== '#cccccc') return fallbackHex;
    const lower = cName.toLowerCase();
    if (lower.includes('orange')) return '#E46D29';
    if (lower.includes('blue')) return '#2E3D52';
    if (lower.includes('silver')) return '#E2E4E1';
    if (lower.includes('violet')) return '#5F5170';
    if (lower.includes('gray') || lower.includes('grey')) return '#686B6F';
    if (lower.includes('black')) return '#222324';
    return '#cccccc';
  };

  const galleryItems = (currentVariant.gallery_images && currentVariant.gallery_images.length > 0)
    ? currentVariant.gallery_images.map((url, idx) => ({ id: String(idx + 1), url }))
    : [{ id: '1', url: currentVariant.image_url }];

  const availableColors: string[] = Array.from(new Set<string>(allVariants.map((v) => v.color_name))).sort((a, b) => {
    const order = [
      'cosmic orange', 'orange', 'silver', 'deep blue', 'blue',
      'titanium black', 'black', 'titanium gray', 'gray', 'grey', 'titanium violet', 'violet'
    ];
    const idxA = order.findIndex((o) => a.toLowerCase().includes(o));
    const idxB = order.findIndex((o) => b.toLowerCase().includes(o));
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });
  const availableStorages: string[] = Array.from(new Set<string>(allVariants.map((v) => v.storage))).sort((a, b) => {
    const parseSize = (s: string) => {
      const num = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
      return s.toLowerCase().includes('tb') ? num * 1024 : num;
    };
    return parseSize(a) - parseSize(b);
  });

  const handleColorChange = (colorName: string) => {
    const match =
      allVariants.find((v) => v.color_name === colorName && v.storage === currentVariant.storage) ||
      allVariants.find((v) => v.color_name === colorName);
    if (match) {
      onSelectVariant(match);
      setSelectedImage(match.image_url);
    }
  };

  const handleStorageChange = (storage: string) => {
    const match =
      allVariants.find((v) => v.storage === storage && v.color_name === currentVariant.color_name) ||
      allVariants.find((v) => v.storage === storage);
    if (match) {
      onSelectVariant(match);
      setSelectedImage(match.image_url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gallery Container */}
      <div className="bg-transparent border-0 shadow-none p-0 animate-fadeInUp">
        <div className="flex flex-col sm:flex-row gap-4">
          
          {/* Thumbnails */}
          <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible flex-shrink-0 sm:w-[80px] no-scrollbar">
            {galleryItems.map((item, idx) => {
              const isSelected = selectedImage === item.url;
              return (
                <button
                  key={item.id}
                  id={`thumb-btn-${idx}`}
                  onClick={() => setSelectedImage(item.url)}
                  className={`w-[68px] h-[68px] flex-shrink-0 rounded-md card-hover p-1 cursor-pointer transition-all flex items-center justify-center bg-white ${
                    isSelected ? 'border-2 border-[#ff5e00] shadow-sm' : 'border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = currentVariant.image_url;
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Main Image and Dropdowns Column */}
          <div className="flex-1 space-y-4">
            {/* Main Image */}
            <div className="relative min-h-[300px] sm:min-h-[440px] flex items-center justify-center bg-white overflow-hidden">
              <img
                id="img-main-product"
                src={selectedImage}
                alt={productName}
                className={`max-h-[300px] sm:max-h-[440px] w-auto object-contain transition-transform duration-300 img-crossfade ${isZoomed ? 'scale-125' : 'scale-100'} cursor-zoom-in mix-blend-multiply`}
                onClick={() => setIsZoomed(!isZoomed)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentVariant.image_url;
                }}
              />
            </div>

            {/* Below the main image: Colour badge on left, Rating on right */}
            <div className="flex items-center justify-between -mt-2 pr-0.5 select-none">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1 flex items-center gap-2 text-sm">
                <span className="text-xs font-semibold text-gray-500">Colour:</span>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs flex-shrink-0"
                  style={{ backgroundColor: getHex(currentVariant.color_name, currentVariant.color_hex) }}
                />
                <span className="font-bold text-gray-900 text-xs">{currentVariant.color_name}</span>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1 flex items-center gap-1.5 text-sm">
                <span className="font-extrabold text-gray-900">{rating.toFixed(1)}</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-gray-500 font-normal">({reviewsCount.toLocaleString('en-IN')})</span>
              </div>
            </div>

            {/* Color & Variant Dropdown Selectors — aligned perfectly flush with main image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Color Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Color</label>
                <div className="relative">
                  <select
                    id="select-variant-color"
                    value={currentVariant.color_name}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md py-2.5 px-3.5 pr-8 text-sm font-medium text-gray-900 shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ff5e00] focus:border-[#ff5e00]"
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Variant Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Variant</label>
                <div className="relative">
                  <select
                    id="select-variant-storage"
                    value={currentVariant.storage}
                    onChange={(e) => handleStorageChange(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md py-2.5 px-3.5 pr-8 text-sm font-medium text-gray-900 shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ff5e00] focus:border-[#ff5e00]"
                  >
                    {availableStorages.map((s) => (
                      <option key={s} value={s}>
                        Storage: {s}, RAM: 12GB
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Storage Pill Buttons */}
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 mr-1">Storage:</span>
              {availableStorages.map((storage) => {
                const isSelected = currentVariant.storage === storage;

                return (
                  <button
                    key={storage}
                    onClick={() => handleStorageChange(storage)}
                    className={`flex items-center cursor-pointer py-1.5 px-3.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-[#ff5e00] bg-orange-50/70 text-[#ff5e00] font-bold shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span>{storage}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Pill Buttons */}
            <div className="flex items-center justify-center gap-2.5 pt-1 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 mr-1">Color:</span>
              {availableColors.map((color) => {
                const matchedVar = allVariants.find((v) => v.color_name === color && v.storage === currentVariant.storage)
                  || allVariants.find((v) => v.color_name === color);
                const hex = getHex(color, matchedVar?.color_hex);
                const isSelected = currentVariant.color_name === color;

                return (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`flex items-center gap-2 cursor-pointer py-1.5 px-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#ff5e00] bg-orange-50/70 text-[#ff5e00] font-bold shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs">{color}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
