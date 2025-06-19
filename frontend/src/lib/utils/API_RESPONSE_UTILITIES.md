# Frontend API Response Utilities

This document explains how to use the standardized API response utilities to ensure consistent handling of backend responses across the frontend application.

## Overview

The backend uses a `ResponseInterceptor` that wraps all API responses in a standardized format. These utilities help the frontend handle this format consistently.

## Standardized Response Structure

### Single Item Response
```typescript
{
  success: true,
  statusCode: 200,
  message: "Data retrieved successfully",
  data: { id: "1", name: "Item Name" }, // Your actual data
  metadata: {
    timestamp: "2025-06-19T10:00:00.000Z",
    path: "/api/items/1",
    version: "1.0",
    correlationId: "req-12345-abc"
  }
}
```

### Paginated Response
```typescript
{
  success: true,
  statusCode: 200,
  message: "Data retrieved successfully",
  data: [{ id: "1", name: "Item 1" }, { id: "2", name: "Item 2" }], // Array of items
  metadata: {
    timestamp: "2025-06-19T10:00:00.000Z",
    path: "/api/items",
    version: "1.0",
    correlationId: "req-12345-abc",
    pagination: {
      page: 1,
      limit: 10,
      total: 50,
      pages: 5
    }
  }
}
```

### Error Response
```typescript
{
  success: false,
  statusCode: 400,
  message: "Validation failed",
  error: "Bad Request",
  details: { field: "name", message: "Name is required" },
  metadata: {
    timestamp: "2025-06-19T10:00:00.000Z",
    path: "/api/items",
    version: "1.0",
    correlationId: "req-12345-abc"
  }
}
```

## Using the Utilities

### 1. Import the Utilities

```typescript
import {
  ApiResponse,
  PaginatedResponse,
  transformApiResponse,
  transformPaginatedResponse,
  handleApiError,
  getErrorMessage,
  getToastErrorMessage,
  getToastSuccessMessage
} from '@/lib/utils/api-response';
```

### 2. Update RTK Query API Definitions

#### For Paginated Endpoints

```typescript
// Before (old way)
getBranches: builder.query<BranchesResponse, BranchQueryParams>({
  query: (params) => ({ url: '', params }),
  providesTags: [TAG_TYPES.BRANCH],
}),

// After (standardized way)
getBranches: builder.query<
  { data: Branch[]; pagination: PaginatedResponse<Branch>['metadata']['pagination'] },
  BranchQueryParams
>({
  query: (params) => ({ url: '', params }),
  transformResponse: (response: PaginatedResponse<Branch>) => 
    transformPaginatedResponse(response),
  providesTags: [TAG_TYPES.BRANCH],
}),
```

#### For Single Item Endpoints

```typescript
// Before (old way)
getBranch: builder.query<Branch, string>({
  query: (id) => `/${id}`,
  providesTags: (_result, _error, id) => [{ type: TAG_TYPES.BRANCH, id }],
}),

// After (standardized way)
getBranch: builder.query<Branch, string>({
  query: (id) => `/${id}`,
  transformResponse: (response: ApiResponse<Branch>) => 
    transformApiResponse(response),
  providesTags: (_result, _error, id) => [{ type: TAG_TYPES.BRANCH, id }],
}),
```

#### For List Endpoints (Non-paginated)

```typescript
getAllBranches: builder.query<Branch[], undefined>({
  query: () => '/all',
  transformResponse: (response: ApiResponse<Branch[]>) => 
    transformApiResponse(response),
  providesTags: [TAG_TYPES.BRANCH],
}),
```

#### For Mutation Endpoints

```typescript
createBranch: builder.mutation<Branch, CreateBranchRequest>({
  query: (data) => ({
    url: '',
    method: 'POST',
    body: data,
  }),
  transformResponse: (response: ApiResponse<Branch>) => 
    transformApiResponse(response),
  invalidatesTags: [TAG_TYPES.BRANCH],
}),
```

### 3. Handle Errors in Components

#### Using Error Utilities

```typescript
import { useCreateBranchMutation } from '@/store/api/branchApi';
import { getErrorMessage, getToastErrorMessage, getToastSuccessMessage } from '@/lib/utils/api-response';
import { toast } from 'sonner'; // or your toast library

function BranchForm() {
  const [createBranch, { isLoading }] = useCreateBranchMutation();

  const handleSubmit = async (data: CreateBranchRequest) => {
    try {
      const result = await createBranch(data).unwrap();
      
      // Success toast
      const successMessage = getToastSuccessMessage('Branch created successfully', 'created');
      toast.success(successMessage.title, { description: successMessage.description });
      
    } catch (error) {
      // Error toast
      const errorMessage = getToastErrorMessage(error);
      toast.error(errorMessage.title, { description: errorMessage.description });
      
      // Or get just the error message string
      const simpleErrorMessage = getErrorMessage(error, 'Failed to create branch');
      console.error(simpleErrorMessage);
    }
  };
}
```

#### Accessing Error Details

```typescript
import { handleApiError } from '@/lib/utils/api-response';

const handleError = (error: unknown) => {
  const errorInfo = handleApiError(error);
  
  console.log('Error message:', errorInfo.message);
  console.log('Status code:', errorInfo.statusCode);
  console.log('Error details:', errorInfo.details);
};
```

### 4. Working with Paginated Data

```typescript
import { useGetBranchesQuery } from '@/store/api/branchApi';

function BranchList() {
  const { data, error, isLoading } = useGetBranchesQuery({ page: 1, limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    const errorMessage = getErrorMessage(error);
    return <div>Error: {errorMessage}</div>;
  }

  // data now has the structure: { data: Branch[], pagination: {...} }
  const branches = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      {branches.map(branch => (
        <div key={branch.id}>{branch.name}</div>
      ))}
      
      {pagination && (
        <div>
          Page {pagination.page} of {pagination.pages} 
          (Total: {pagination.total} items)
          {/* Note: Use pagination.pages instead of pagination.totalPages */}
        </div>
      )}
    </div>
  );
}
```

### 5. Type Safety

The utilities maintain full TypeScript type safety:

```typescript
// Correctly typed
const { data } = useGetBranchQuery('123'); // data: Branch | undefined
const { data: branches } = useGetBranchesQuery(); // data: { data: Branch[], pagination: {...} } | undefined
const { data: allBranches } = useGetAllBranchesQuery(); // data: Branch[] | undefined
```

## Migration Checklist

When updating existing API files:

- [ ] Import the utility functions
- [ ] Update paginated endpoints to use `transformPaginatedResponse`
- [ ] Update single item endpoints to use `transformApiResponse` 
- [ ] Update list endpoints to use `transformApiResponse`
- [ ] Update mutation endpoints to use `transformApiResponse`
- [ ] Update component error handling to use error utilities
- [ ] **Update pagination references**: Change `pagination.totalPages` to `pagination.pages`
- [ ] **Verify data access**: Ensure components access `data?.data` for arrays and `data` for single items
- [ ] Test all endpoints to ensure they work correctly
- [ ] Update component data access patterns for paginated responses

## Common Migration Issues

### Pagination Structure Changes
```typescript
// ❌ OLD: Before standardization
const totalPages = pagination?.totalPages || 1;

// ✅ NEW: After standardization  
const totalPages = pagination?.pages || 1;
```

### Data Access Patterns
```typescript
// ❌ OLD: Direct array access
const items = apiResponse || []; // This will fail

// ✅ NEW: Standardized access
const items = apiResponse?.data || []; // For paginated/list endpoints
const item = apiResponse; // For single item endpoints (after transform)
```

### Error Handling
```typescript
// ❌ OLD: Manual error handling
if (error) {
  console.error('Something went wrong');
}

// ✅ NEW: Standardized error handling
if (error) {
  const errorMessage = getErrorMessage(error, 'Failed to load data');
  console.error(errorMessage);
}
```

## Benefits

1. **Consistency**: All API responses follow the same structure
2. **Type Safety**: Full TypeScript support with proper typing
3. **Error Handling**: Standardized error handling across the app
4. **Debugging**: Correlation IDs and metadata for easier debugging
5. **Maintainability**: Centralized response handling logic
6. **User Experience**: Consistent error and success messages

## Testing

To verify the utilities work correctly:

1. Check that paginated endpoints return `{ data: [], pagination: {...} }`
2. Check that single item endpoints return the item directly
3. Check that error handling shows appropriate messages
4. Verify that TypeScript types are correct
5. Test with actual API calls to ensure transformations work
