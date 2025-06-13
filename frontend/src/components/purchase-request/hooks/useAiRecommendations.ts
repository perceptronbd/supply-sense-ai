import {
  type PurchaseRequestFormData,
  type PurchaseRequestItemFormData,
} from '@/lib/schemas/purchase-request.schema';
import {
  type PurchaseRecommendation,
  useGeneratePurchaseRecommendationsMutation,
} from '@/store/api/aiApi';
import { addToast } from '@heroui/react';
import { useState } from 'react';

interface UseAiRecommendationsProps {
  formData: Partial<PurchaseRequestFormData>;
  branchOptions: Array<{ value: string; label: string }>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PurchaseRequestFormData>>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  errors: Record<string, string[]>;
}

export function useAiRecommendations({
  formData,
  branchOptions,
  setFormData,
  setErrors,
  errors,
}: UseAiRecommendationsProps) {
  const [generateRecommendations, { isLoading: isGeneratingRecommendations }] =
    useGeneratePurchaseRecommendationsMutation();

  const validateBranchSelection = (): boolean => {
    if (!formData.branchId) {
      console.log('❌ No branch selected');
      addToast({
        title: 'Branch Required',
        description: 'Please select a branch before generating AI recommendations',
        color: 'warning',
        variant: 'flat',
      });
      return false;
    }

    if (branchOptions.length === 0) {
      console.log('❌ No branches available');
      addToast({
        title: 'No Branches Available',
        description: 'No branches are available for generating recommendations',
        color: 'warning',
        variant: 'flat',
      });
      return false;
    }

    return true;
  };

  const convertRecommendationsToItems = (
    recommendations: PurchaseRecommendation[],
    defaultDate: string
  ): PurchaseRequestItemFormData[] => {
    return recommendations.map((rec) => ({
      itemId: rec.itemId,
      requestedQty: rec.recommendedQuantity,
      estimatedPrice: rec.estimatedCost / rec.recommendedQuantity,
      requiredDate: defaultDate,
      remarks: `AI Generated - ${rec.reasoning} (Confidence: ${Math.round(rec.confidence * 100)}%)`,
    }));
  };

  const handleGenerateRecommendations = async () => {
    console.log('🚀 Generate AI Recommendations button clicked!');

    if (!validateBranchSelection()) {
      return;
    }

    const branchToUse = formData.branchId;
    if (!branchToUse) {
      return; // This should never happen due to validation, but TypeScript safety
    }
    console.log('✅ Starting API call with branch:', branchToUse);

    try {
      const result = await generateRecommendations({
        branchId: branchToUse,
        createActualPRs: false,
      }).unwrap();

      console.log('📊 API Response:', result);

      if (result.recommendations && result.recommendations.length > 0) {
        const defaultDate = formData.requiredDate || new Date().toISOString().split('T')[0];
        const recommendedItems = convertRecommendationsToItems(result.recommendations, defaultDate);

        console.log('📝 Generated items:', recommendedItems);

        setFormData((prev: Partial<PurchaseRequestFormData>) => ({
          ...prev,
          items: recommendedItems,
        }));

        addToast({
          title: 'AI Recommendations Generated',
          description: `Generated ${result.recommendations.length} item recommendations based on AI analysis`,
          color: 'success',
          variant: 'flat',
        });

        if (errors.items) {
          setErrors((prev: Record<string, string[]>) => ({ ...prev, items: [] }));
        }
      } else {
        console.log('⚠️ No recommendations returned');
        addToast({
          title: 'No Recommendations',
          description: 'No purchase recommendations were generated for this branch',
          color: 'default',
          variant: 'flat',
        });
      }
    } catch (error) {
      console.error('❌ Failed to generate AI recommendations:', error);
      addToast({
        title: 'Generation Failed',
        description: 'Failed to generate AI recommendations. Please try again.',
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  return {
    handleGenerateRecommendations,
    isGeneratingRecommendations,
  };
}
