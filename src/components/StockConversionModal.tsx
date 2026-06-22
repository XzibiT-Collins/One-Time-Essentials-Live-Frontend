import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Dropdown } from './Dropdown';
import { productService } from '../services/productService';
import type { ConversionResponse, ProductVariantSummaryResponse } from '../types';
import toast from 'react-hot-toast';

interface StockConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  productName: string;
  onSuccess?: () => void;
}

export const StockConversionModal: React.FC<StockConversionModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess
}) => {
  const [conversionTab, setConversionTab] = useState<'FORWARD' | 'REVERSE'>('FORWARD');
  const [conversionQuantity, setConversionQuantity] = useState('');
  const [targetProductId, setTargetProductId] = useState('');
  const [targetVariants, setTargetVariants] = useState<ProductVariantSummaryResponse[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSummary, setConversionSummary] = useState<ConversionResponse | null>(null);

  useEffect(() => {
    if (isOpen && conversionTab === 'REVERSE' && targetVariants.length === 0 && productId) {
      productService.getReverseConversionTargetVariants(productId)
        .then(setTargetVariants)
        .catch(() => {});
    }
  }, [isOpen, conversionTab, productId, targetVariants.length]);

  // Reset state when closing or opening
  useEffect(() => {
    if (!isOpen) {
      setConversionSummary(null);
      setConversionQuantity('');
      setTargetProductId('');
    }
  }, [isOpen]);

  const handleConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setIsConverting(true);
    setConversionSummary(null);

    try {
      if (conversionTab === 'FORWARD') {
        const res = await productService.forwardConversion({ 
          sourceProductId: productId, 
          quantity: Number(conversionQuantity) 
        });
        setConversionSummary(res);
        toast.success('Forward conversion completed successfully');
      } else {
        const res = await productService.reverseConversion({
          sourceProductId: productId,
          targetProductId: Number(targetProductId),
          quantity: Number(conversionQuantity)
        });
        setConversionSummary(res);
        toast.success('Reverse conversion completed successfully');
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.description || 'Conversion failed. Please check rules.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setConversionSummary(null); }} title={`Stock Conversion - ${productName}`}>
      {conversionSummary ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-xl">
            <h3 className="font-bold mb-2">Conversion Successful</h3>
            <p className="text-sm">From: <strong>{conversionSummary.fromProductName}</strong></p>
            <p className="text-sm">To: <strong>{conversionSummary.toProductName}</strong></p>
            <p className="text-sm">Quantity Used: <strong>{conversionSummary.fromQuantity}</strong></p>
            <p className="text-sm">Quantity Added: <strong>{conversionSummary.toQuantity}</strong></p>
            <p className="text-sm">Variance: <strong>{conversionSummary.varianceAmount}</strong></p>
            <p className="text-sm font-bold mt-2">Valuation derived from FIFO layers.</p>
          </div>
          <Button onClick={() => setConversionSummary(null)} className="w-full h-12 rounded-2xl">
            Do Another Conversion
          </Button>
        </div>
      ) : (
        <form onSubmit={handleConversion} className="space-y-6">
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${conversionTab === 'FORWARD' ? 'bg-white dark:bg-zinc-700 shadow text-accent-dark' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              onClick={() => { setConversionTab('FORWARD'); setConversionSummary(null); }}
            >
              Forward (Bulk to Base)
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${conversionTab === 'REVERSE' ? 'bg-white dark:bg-zinc-700 shadow text-accent-dark' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              onClick={() => { setConversionTab('REVERSE'); setConversionSummary(null); }}
            >
              Reverse (Base to Bulk)
            </button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl space-y-4 border border-gray-100 dark:border-zinc-700">
            {conversionTab === 'REVERSE' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#999999] mb-2">
                  Target Variant SKU
                </label>
                <Dropdown
                  value={targetProductId}
                  onChange={(val) => setTargetProductId(val)}
                  options={[
                    { label: 'Select Target Variant...', value: '' },
                    ...targetVariants.map((v) => ({
                      label: `${v.variantName} (${v.variantSku})`,
                      value: String(v.variantId)
                    }))
                  ]}
                />
                <p className="text-xs text-gray-500 mt-2">Target must be a variant in the same family as this base unit.</p>
              </div>
            )}
            
            <Input 
              label={conversionTab === 'FORWARD' ? "Source Quantity to Convert (Bulk)" : "Source Quantity to Convert (Base EA)"}
              type="number" 
              value={conversionQuantity}
              onChange={(e) => setConversionQuantity(e.target.value)} 
              required 
              min="1"
            />
            <p className="text-[10px] text-zinc-500 italic mt-1 text-center">
              Note: Conversion cost is derived from FIFO layers. Mixed-cost source stock may affect resulting variant cost.
            </p>
          </div>

          <Button type="submit" isLoading={isConverting} className="w-full h-12 rounded-2xl">
            Execute Conversion
          </Button>
        </form>
      )}
    </Modal>
  );
};
