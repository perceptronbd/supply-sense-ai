'use client';

import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useGetAllItemsQuery, useSearchItemsQuery } from '../../store/api/itemApi';
import type { Item } from '../../store/api/itemApi';

interface ItemSelectorProps {
  value?: string;
  onChange: (itemId: string, item?: Item) => void;
  branchId?: string;
  placeholder?: string;
  label?: string;
  isRequired?: boolean;
  errorMessage?: string;
  isInvalid?: boolean;
}

export function ItemSelector({
  value,
  onChange,
  branchId,
  placeholder = 'Search and select an item...',
  label = 'Item',
  isRequired = false,
  errorMessage,
  isInvalid = false,
}: ItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');

  // Use different queries based on whether user is searching or not
  const shouldSearch = searchTerm.length > 0;

  // Get all items for initial display (when no search term)
  const { data: allItems = [], isLoading: isLoadingAll } = useGetAllItemsQuery(
    { branchId },
    { skip: shouldSearch }
  );

  // Search items when user types
  const { data: searchResults = [], isLoading: isSearching } = useSearchItemsQuery(
    {
      q: searchTerm,
      branchId,
      limit: 20,
    },
    { skip: !shouldSearch }
  );

  // Use search results when searching, otherwise use all items
  const items = shouldSearch ? searchResults : allItems;
  const isLoading = shouldSearch ? isSearching : isLoadingAll;

  // Find the selected item to display its name
  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === value);
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
      const selectedItem = items.find((item) => item.id === itemId);
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
      label={label}
      placeholder={placeholder}
      isRequired={isRequired}
      errorMessage={errorMessage}
      isInvalid={isInvalid}
      isLoading={isLoading}
      inputValue={inputValue}
      selectedKey={value || null}
      onInputChange={handleInputChange}
      onSelectionChange={(key) => handleSelectionChange(key as string)}
      className="w-full"
    >
      {items.map((item) => (
        <AutocompleteItem key={item.id} textValue={item.name}>
          <div className="flex flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm text-gray-500">
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
