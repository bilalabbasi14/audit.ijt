import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getMonthList, getCurrentSessionYear } from "@/utils/session";
import { useState, useEffect } from "react";
import { format } from "date-fns";

type MonthSelectorProps = {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  sessionYear?: number;
};

export default function MonthSelector({ value, onChange, sessionYear = getCurrentSessionYear() }: MonthSelectorProps) {
  const months = getMonthList(sessionYear);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
