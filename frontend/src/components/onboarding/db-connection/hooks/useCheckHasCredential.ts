import { useEffect, useState } from 'react';
import type { UseFormWatch } from 'react-hook-form';
import type { DbConnectionFormData } from '../schema';

export function useCheckHasCredential({
  watch,
}: {
  watch: UseFormWatch<DbConnectionFormData>;
}) {
  const [error, setError] = useState('');

  // Watch specific fields
  const credentialHost = watch('credential.host');
  const credentialPort = watch('credential.port');
  const credentialUsername = watch('credential.username');
  const credentialPassword = watch('credential.password');
  const credentialDatabase = watch('credential.database');
  const connectionString = watch('connectionString');

  useEffect(() => {
    const hasCredentials =
      credentialHost &&
      credentialPort &&
      credentialUsername &&
      credentialPassword &&
      credentialDatabase;
    const hasConnectionString = connectionString && connectionString.trim().length > 0;
    if (hasCredentials || hasConnectionString) {
      setError('');
    }
  }, [
    credentialHost,
    credentialPort,
    credentialUsername,
    credentialPassword,
    credentialDatabase,
    connectionString,
  ]);

  const checkHasCredentials = (data: DbConnectionFormData) => {
    // Check if credentials are provided (all required fields filled)
    const hasCredentials =
      data.credential?.host &&
      data.credential?.port &&
      data.credential?.username &&
      data.credential?.password &&
      data.credential?.database;

    // Check if connection string is provided
    const hasConnectionString = data.connectionString && data.connectionString.trim().length > 0;
    const shouldShowError = !hasCredentials && !hasConnectionString;
    // Validate that either credentials or connection string is provided
    if (shouldShowError) {
      setError('You must provide either credentials or a connection string');
    }
    return shouldShowError;
  };

  return { error, checkHasCredentials };
}
