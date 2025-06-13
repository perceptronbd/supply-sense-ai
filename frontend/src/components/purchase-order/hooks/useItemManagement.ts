import type {
  PurchaseOrderFormData,
  PurchaseOrderItemFormData,
} from '@/lib/schemas/purchase-order.schema';
import { useState } from 'react';

interface UseItemManagementProps {
  formData: Partial<PurchaseOrderFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PurchaseOrderFormData>>>;
  errors: Record<string, string[]>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

export function useItemManagement({
  formData,
  setFormData,
  errors,
  setErrors,
}: UseItemManagementProps) {
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleAddItem = (item: PurchaseOrderItemFormData) => {
    if (editingItemIndex !== null) {
      // Edit existing item
      const updatedItems = [...(formData.items || [])];
      updatedItems[editingItemIndex] = item;
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      setFormData((prev) => ({
        ...prev,
        items: [...(prev.items || []), item],
      }));
    }

    // Clear item errors
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: [] }));
    }

    setShowItemForm(false);
    setEditingItemIndex(null);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items?.filter((_, i) => i !== index) || [];
    setFormData((prev) => ({ ...prev, items: updatedItems }));

    // Clear item errors if no items left
    if (updatedItems.length === 0 && errors.items) {
      setErrors((prev) => ({ ...prev, items: [] }));
    }
  };

  const calculateTotalAmount = () => {
    return (
      formData.items?.reduce((total, item) => {
        return total + Number(item.orderedQty) * Number(item.unitPrice);
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
    calculateTotalAmount,
  };
}
