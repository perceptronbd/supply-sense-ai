'use client';

import { useGetAllItemsQuery, useSearchItemsQuery } from '@/store/api/itemApi';
import type { Item } from '@/store/api/itemApi';
import { Autocomplete, AutocompleteItem, type AutocompleteProps } from '@heroui/react';
import { useMemo, useState } from 'react';

interface ItemSelectorProps
  extends Omit<
    AutocompleteProps,
    'children' | 'onSelectionChange' | 'inputValue' | 'onInputChange' | 'onChange'
  > {
  value?: string;
  onChange: (itemId: string, item?: Item) => void;
  branchId?: string;
}

export function ItemSelector({ value, onChange, branchId, ...props }: ItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');

  // Use different queries based on whether user is searching or not
  const shouldSearch = searchTerm.length > 0;

  // Get all items for initial display (when no search term)
  const { data: allItemsData, isLoading: isLoadingAll } = useGetAllItemsQuery(
    { branchId },
    { skip: shouldSearch }
  );

  // Search items when user types
  const { data: searchResultsData, isLoading: isSearching } = useSearchItemsQuery(
    {
      q: searchTerm,
      branchId,
      limit: 20,
    },
    { skip: !shouldSearch }
  );

  // Ensure we always have arrays to work with, with debugging
  const allItems = Array.isArray(allItemsData) ? allItemsData : [];
  const searchResults = Array.isArray(searchResultsData) ? searchResultsData : [];

  // Debug logging for ItemSelector data
  console.log('=== ITEMSELECTOR DEBUG ===');
  console.log('allItemsData:', allItemsData, 'isArray:', Array.isArray(allItemsData));
  console.log(
    'searchResultsData:',
    searchResultsData,
    'isArray:',
    Array.isArray(searchResultsData)
  );
  console.log('allItems:', allItems, 'length:', allItems.length);
  console.log('searchResults:', searchResults, 'length:', searchResults.length);
  console.log('shouldSearch:', shouldSearch);
  console.log('=== END DEBUG ===');

  // Use search results when searching, otherwise use all items
  const items = shouldSearch ? searchResults : allItems;
  const isLoading = shouldSearch ? isSearching : isLoadingAll;

  // Find the selected item to display its name
  const selectedItem = useMemo(() => {
    return Array.isArray(items) ? items.find((item) => item.id === value) : undefined;
  }, [items, value]);

  // Set the input value when an item is selected externally
  useMemo(() => {
    if (value && selectedItem && !searchTerm) {
      setInputValue(selectedItem.name);
    } else if (!value && !searchTerm) {
      setInputValue('');
    }
  }, [value, selectedItem, searchTerm]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setSearchTerm(val);
  };

  const handleSelectionChange = (itemId: string | null) => {
    if (itemId) {
      const selectedItem = Array.isArray(items)
        ? items.find((item) => item.id === itemId)
        : undefined;
      onChange(itemId, selectedItem);
      if (selectedItem) {
        setInputValue(selectedItem.name);
        setSearchTerm(''); // Clear search to return to full list
      }
    } else {
      onChange('');
      setInputValue('');
      setSearchTerm(''); // Clear search to return to full list
    }
  };

  return (
    <Autocomplete
      isLoading={isLoading}
      inputValue={inputValue}
      selectedKey={value || null}
      onInputChange={handleInputChange}
      onSelectionChange={(key) => handleSelectionChange(key as string)}
      variant="bordered"
      classNames={{
        popoverContent: 'bg-default-200',
      }}
      {...props}
    >
      {(Array.isArray(items) ? items : []).map((item) => (
        <AutocompleteItem key={item.id} textValue={item.name}>
          <div className="flex flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm opacity-60">
              SKU: {item.sku} | Unit: {item.mainUnit}
              {item.stock && (
                <span className="ml-2">
                  Stock: {item.stock.availableQty} {item.mainUnit}
                </span>
              )}
            </span>
          </div>
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
}
