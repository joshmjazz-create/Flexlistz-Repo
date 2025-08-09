import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from './ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  field: 'key' | 'composer' | 'style';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AutocompleteInput({
  field,
  value,
  onChange,
  placeholder,
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Fetch field values for autocomplete
  const { data: fieldValues = [] } = useQuery<string[]>({
    queryKey: [`/api/field-values/${field}`],
  });

  // Filter values based on input
  const filteredValues = fieldValues.filter(val =>
    val.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
  };

  const showDropdown = inputValue.length > 0 && filteredValues.length > 0;

  return (
    <Popover open={open && showDropdown} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={className}
          />
          {showDropdown && (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup className="max-h-48 overflow-y-auto">
            {filteredValues.slice(0, 10).map((fieldValue) => (
              <CommandItem
                key={fieldValue}
                value={fieldValue}
                onSelect={handleSelect}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === fieldValue ? "opacity-100" : "opacity-0"
                  )}
                />
                {fieldValue}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}