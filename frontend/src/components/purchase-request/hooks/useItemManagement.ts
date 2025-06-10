import { useState } from 'react';
import {
  type PurchaseRequestFormData,
  type PurchaseRequestItemFormData,
} from '../../../lib/schemas/purchase-request.schema';
import type { PurchaseRequestTemplate } from '../../../store/api/purchaseRequestApi';

interface UseItemManagementProps {
  formData: Partial<PurchaseRequestFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PurchaseRequestFormData>>>;
  errors: Record<string, string[]>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  templates: PurchaseRequestTemplate[];
}

export function useItemManagement({
  formData,
  setFormData,
  errors,
  setErrors,
  templates,
}: UseItemManagementProps) {
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleAddItem = (item: PurchaseRequestItemFormData) => {
    const currentItems = formData.items || [];
    if (editingItemIndex !== null) {
      // Update existing item
      const updatedItems = [...currentItems];
      updatedItems[editingItemIndex] = item;
      setFormData((prev: Partial<PurchaseRequestFormData>) => ({ ...prev, items: updatedItems }));
      setEditingItemIndex(null);
    } else {
      // Add new item
      setFormData((prev: Partial<PurchaseRequestFormData>) => ({
        ...prev,
        items: [...currentItems, item],
      }));
    }
    setShowItemForm(false);

    // Clear items error if it exists
    if (errors.items) {
      setErrors((prev: Record<string, string[]>) => ({ ...prev, items: [] }));
    }
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems =
      formData.items?.filter((_: PurchaseRequestItemFormData, i: number) => i !== index) || [];
    setFormData((prev: Partial<PurchaseRequestFormData>) => ({ ...prev, items: updatedItems }));
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const defaultDate = formData.requiredDate || new Date().toISOString().split('T')[0];
      const templateItems: PurchaseRequestItemFormData[] = template.items.map((item) => ({
        itemId: item.itemId,
        requestedQty: item.defaultQty,
        estimatedPrice: item.item.currentPrice || undefined,
        requiredDate: defaultDate,
        remarks: undefined,
      }));
      setFormData((prev: Partial<PurchaseRequestFormData>) => ({ ...prev, items: templateItems }));
    }
  };

  const calculateTotalAmount = () => {
    return (
      formData.items?.reduce((total: number, item: PurchaseRequestItemFormData) => {
        const price = Number(item.estimatedPrice) || 0;
        const qty = Number(item.requestedQty) || 0;
        return total + price * qty;
      }, 0) || 0
    );
  };

  return {
    showItemForm,
    setShowItemForm,
    editingItemIndex,
    setEditingItemIndex,
    handleAddItem,
    handleEditItem,
    handleRemoveItem,
    handleLoadTemplate,
    calculateTotalAmount,
  };
}
