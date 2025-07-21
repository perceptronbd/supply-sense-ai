import Summary from '../Summary';
import MetadataAccordion from './MetadataAccordion';

const MetadataCapture = () => {
  return (
    <>
      {/* left side info  */}
      <Summary
        header="Help the Agent"
        headerHighlight="Understand Your Data"
        description="Provide a short description for each table so the agent knows how to interpret your schema."
      />

      {/* right side form */}
      <MetadataAccordion />
    </>
  );
};

export default MetadataCapture;
