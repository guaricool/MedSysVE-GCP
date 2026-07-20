"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const countries = [
  { value: "+58", label: "🇻🇪 +58 (VEN)" },
  { value: "+1", label: "🇺🇸 +1 (USA)" },
  { value: "+57", label: "🇨🇴 +57 (COL)" },
  { value: "+593", label: "🇪🇨 +593 (ECU)" },
  { value: "+56", label: "🇨🇱 +56 (CHL)" },
  { value: "+34", label: "🇪🇸 +34 (ESP)" },
  { value: "+51", label: "🇵🇪 +51 (PER)" },
  { value: "+54", label: "🇦🇷 +54 (ARG)" },
]

export function CountryCodeSelect({ 
  value, 
  onChange 
}: { 
  value?: string, 
  onChange: (value: string) => void 
}) {
  const [open, setOpen] = React.useState(false)

  // Default to +58 if not set
  const currentValue = value || "+58"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[110px] justify-between px-2 bg-slate-900 border-slate-800 text-white hover:bg-slate-800 hover:text-white"
        >
          {countries.find((country) => country.value === currentValue)?.label?.split(" ")[0]} {currentValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Buscar código..." />
          <CommandList>
            <CommandEmpty>No encontrado.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={(currentValue) => {
                    onChange(country.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentValue === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
