import Summary from '../Summary';
import DbConnectionForm from './DbConnectionForm';

const DbConnection = () => {
  return (
    <>
      {/* left side info  */}
      <Summary
        header="Connect Your"
        headerHighlight="Database"
        description="Your credentials will be encrypted and your data will not be stored or tracked."
      />
      {/* right side form */}
      <DbConnectionForm />
    </>
  );
};

export default DbConnection;
