import React, { useMemo } from 'react';
import ActionButton, { TActionButtonVariants } from './ActionButton';

interface Props {
  buttonClicked: TActionButtonVariants | null; // Currently clicked button variant
  onButtonClick: (variant: TActionButtonVariants) => void; // Handler for button click
}

const RelationshipActionButtons: React.FC<Props> = ({ buttonClicked, onButtonClick }) => {
  // Memoize the logic to determine which buttons to display based on the current state
  const buttons = useMemo(() => {
    const show = new Set<TActionButtonVariants>();

    // Show initial options if no button is clicked, or if 'edit' or 'no' is clicked
    if (!buttonClicked || buttonClicked === 'edit' || buttonClicked === 'no') {
      show.add('yes');
      show.add('no');
      show.add('not-sure');
    } else if (buttonClicked === 'yes') {
      // After confirming, show 'confirmed' and 'edit' options
      show.add('confirmed');
      show.add('edit');
    } else if (buttonClicked === 'not-sure' || buttonClicked === 'uncertain') {
      // If unsure, show 'uncertain' and 'edit' options
      show.add('uncertain');
      show.add('edit');
    }

    return Array.from(show); // Convert Set to Array for rendering
  }, [buttonClicked]);

  // Render the action buttons dynamically based on the computed variants
  return (
    <div className="flex items-center gap-5">
      {buttons.map((variant) => (
        <ActionButton
          key={variant}
          variants={variant}
          onPress={() => {
            onButtonClick(variant); // Call the handler with the selected variant
          }}
        />
      ))}
    </div>
  );
};

export default RelationshipActionButtons;
