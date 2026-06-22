import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { StockConversionModal } from '../components/StockConversionModal';
import { productService } from '../services/productService';
import { ProductListing } from '../types';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Package, X, ArrowRightLeft } from 'lucide-react';
import { formatPrice } from '../utils';

export const StockConversion = () => {
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const debouncedProductSearch = useDebounce(productSearchQuery, 400);
  const [searchResults, setSearchResults] = useState<ProductListing[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);

  useEffect(() => {
    if (debouncedProductSearch.trim()) {
      setIsSearchingProducts(true);
      productService.adminSearch({ searchTerm: debouncedProductSearch, page: 0, size: 8 })
        .then((res) => {
          setSearchResults(res.content);
          setShowResults(true);
        })
        .finally(() => setIsSearchingProducts(false));
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedProductSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: ProductListing) => {
    setSelectedProduct(product);
    setShowResults(false);
    setProductSearchQuery('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
          <ArrowRightLeft className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Stock Conversion</h1>
          <p className="text-sm text-zinc-500">Search for a product to convert stock between bulk and base units.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-[#F5F5F5] dark:border-zinc-800 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-widest text-[#999999] mb-4">
          Find Product
        </label>
        
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 dark:text-white border border-transparent focus:border-accent transition-all text-sm font-medium"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              onFocus={() => productSearchQuery && setShowResults(true)}
            />
            {isSearchingProducts && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {productSearchQuery && !isSearchingProducts && (
              <button 
                onClick={() => { setProductSearchQuery(''); setShowResults(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 bg-zinc-100 dark:bg-zinc-700 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-[#F5F5F5] dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {searchResults.map((p) => (
                  <button
                    key={p.productId}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-[#F5F5F5] dark:border-zinc-800 last:border-0 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                        {p.productImage || (p as any).productImageUrl ? (
                          <img src={p.productImage || (p as any).productImageUrl} alt={p.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{p.productName}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{formatPrice(p.price)} • {p.stockQuantity} in stock</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {showResults && searchResults.length === 0 && !isSearchingProducts && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-[#F5F5F5] dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-6 text-center">
              <p className="text-zinc-500 text-sm">No products found for "{productSearchQuery}"</p>
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-4">Selected Product</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-700">
                  {selectedProduct.productImage || (selectedProduct as any).productImageUrl ? (
                    <img 
                      src={selectedProduct.productImage || (selectedProduct as any).productImageUrl} 
                      alt={selectedProduct.productName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold dark:text-white mb-1">{selectedProduct.productName}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {formatPrice(selectedProduct.price)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      {selectedProduct.stockQuantity} in stock
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-8 h-12 rounded-xl shrink-0 shadow-lg shadow-accent/20"
              >
                Execute Conversion
              </Button>
            </div>
          </div>
        )}
      </div>

      <StockConversionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={selectedProduct?.productId || null}
        productName={selectedProduct?.productName || ''}
        onSuccess={() => {
          // Do not close the modal here so the success summary is visible.
        }}
      />
    </div>
  );
};
