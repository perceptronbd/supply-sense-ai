import { Card, CardBody, CardHeader } from '@heroui/react';
import { purchaseRequestSchema } from '../../lib/schemas/purchase-request.schema';
import { ValidatedSelect } from '../ui/ValidatedSelect';

interface TemplateSelectionProps {
  templateOptions: Array<{ value: string; label: string }>;
  onLoadTemplate: (templateId: string) => void;
}

export function TemplateSelection({ templateOptions, onLoadTemplate }: TemplateSelectionProps) {
  if (templateOptions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold">Templates</h3>
      </CardHeader>
      <CardBody>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <ValidatedSelect
              name="templateId"
              label="Load from Template"
              wasSubmitted={false}
              fieldSchema={purchaseRequestSchema.shape.prTemplateId}
              options={templateOptions}
              placeholder="Select a template to load items"
              onValueChange={(_, value) => {
                if (value) {
                  onLoadTemplate(value);
                }
              }}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
