import { Button } from '@heroui/react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';

interface ConnectionsTitleAndButtonsProps {
  /**
   * Main title of the form
   */
  title: string;
  /**
   * Subtitle or description of the form
   */
  description?: string;
  /**
   * Text for the primary action button
   */
  primaryActionText?: string;
  /**
   * Text for the secondary action button
   */
  secondaryActionText?: string;
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;
  /**
   * Whether the form is disabled
   */
  isDisabled?: boolean;
  /**
   * Callback when primary action is triggered
   */
  onPrimaryAction?: () => void;
  /**
   * Callback when secondary action is triggered
   */
  onSecondaryAction?: () => void;
  /**
   * Show loading state for primary button
   */
  isLoadingPrimary?: boolean;
  /**
   * Show loading state for secondary button
   */
  isLoadingSecondary?: boolean;
  /**
   * Show chevron icon on secondary button
   */
  showChevronOnSecondary?: boolean;
}

export const ConnectionsTitleAndButtons = ({
  title,
  description,
  primaryActionText = 'Save',
  secondaryActionText = 'Next',
  isSubmitting = false,
  isDisabled = false,
  onPrimaryAction,
  onSecondaryAction,
  isLoadingPrimary = false,
  isLoadingSecondary = false,
  showChevronOnSecondary = true,
}: ConnectionsTitleAndButtonsProps) => {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <Text variant="headerSmall" weight="semiBold">
          {title}
        </Text>
        {description && (
          <Text variant="bodyMedium" color="secondary" className="mt-1">
            {description}
          </Text>
        )}
      </div>

      {/* Buttons */}
      {(onPrimaryAction || onSecondaryAction) && (
        <div className="flex gap-4">
          {onPrimaryAction && (
            <Button
              variant="flat"
              color="primary"
              type="submit"
              onPress={onPrimaryAction}
              isLoading={isLoadingPrimary || isSubmitting}
              isDisabled={isDisabled || isSubmitting}
            >
              {primaryActionText}
            </Button>
          )}
          {onSecondaryAction && (
            <Button
              variant="flat"
              color="secondary"
              onPress={onSecondaryAction}
              endContent={
                showChevronOnSecondary ? <Icons.ChevronRight className="size-5" /> : undefined
              }
              isDisabled={isDisabled || isSubmitting}
              isLoading={isLoadingSecondary}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
