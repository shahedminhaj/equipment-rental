"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EquipmentListing } from "../lib/api";

export type AdminEquipmentForm = {
  name: string;
  description: string;
  category: string;
  location: string;
  price: number;
  rentalType: EquipmentListing["rentalType"];
  availableQuantity: number;
  image: string;
  condition: string;
  brand: string;
  model: string;
};

const blankForm: AdminEquipmentForm = {
  name: "",
  description: "",
  category: "",
  location: "",
  price: 1,
  rentalType: "Daily",
  availableQuantity: 1,
  image: "",
  condition: "Good",
  brand: "",
  model: "",
};

const labelClass = "grid gap-1.5 text-xs font-semibold text-slate-600";

export function AdminEquipmentDialog({
  open,
  item,
  error,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  item?: EquipmentListing;
  error: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminEquipmentForm) => void;
}) {
  const [form, setForm] = useState<AdminEquipmentForm>(blankForm);
  const editing = Boolean(item);

  useEffect(() => {
    if (!open) return;
    setForm(item ? {
      name: item.name,
      description: item.description || "",
      category: item.category,
      location: item.location,
      price: item.price,
      rentalType: item.rentalType,
      availableQuantity: item.availableQuantity,
      image: item.image,
      condition: item.condition || "Good",
      brand: item.brand || "",
      model: item.model || "",
    } : blankForm);
  }, [open, item]);

  function update<K extends keyof AdminEquipmentForm>(key: K, value: AdminEquipmentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ ...form, name: form.name.trim(), description: form.description.trim(), category: form.category.trim(), location: form.location.trim(), image: form.image.trim(), condition: form.condition.trim(), brand: form.brand.trim(), model: form.model.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e9f2e3] text-[#315c3c]">
            <PackagePlus size={20} aria-hidden="true" />
          </span>
          <div>
            <DialogTitle>{editing ? "Edit equipment" : "Add equipment"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this listing's details. Changes are saved to the marketplace." : "Create a listing as admin. It will be approved and visible in equipment search immediately."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form id="admin-equipment-form" onSubmit={handleSubmit} className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label className={`${labelClass} sm:col-span-2`}>
              Equipment name
              <Input required maxLength={200} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Portable PA & Projector Kit" />
            </Label>
            <Label className={labelClass}>
              Category
              <Input required maxLength={200} value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="e.g. Construction Equipment" />
            </Label>
            <Label className={labelClass}>
              Location
              <Input required maxLength={200} value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="e.g. Dhaka" />
            </Label>
            <Label className={labelClass}>
              Rental price (৳)
              <Input required type="number" min={1} step={1} value={form.price} onChange={(event) => update("price", Number(event.target.value))} />
            </Label>
            <Label className={labelClass}>
              Rental period
              <select value={form.rentalType} onChange={(event) => update("rentalType", event.target.value as AdminEquipmentForm["rentalType"])} className="h-9 rounded-lg border border-[#d9e2d2] bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-[#8aaa78] focus:ring-2 focus:ring-[#dce9d4]">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </Label>
            <Label className={labelClass}>
              Available quantity
              <Input required type="number" min={0} step={1} value={form.availableQuantity} onChange={(event) => update("availableQuantity", Number(event.target.value))} />
            </Label>
            <Label className={labelClass}>
              Condition
              <Input maxLength={200} value={form.condition} onChange={(event) => update("condition", event.target.value)} placeholder="Good" />
            </Label>
            <Label className={labelClass}>
              Brand
              <Input maxLength={100} value={form.brand} onChange={(event) => update("brand", event.target.value)} placeholder="Brand name" />
            </Label>
            <Label className={labelClass}>
              Model
              <Input maxLength={100} value={form.model} onChange={(event) => update("model", event.target.value)} placeholder="Model number" />
            </Label>
            <Label className={`${labelClass} sm:col-span-2`}>
              Image URL
              <Input required type="url" maxLength={2048} value={form.image} onChange={(event) => update("image", event.target.value)} placeholder="https://..." />
            </Label>
            <Label className={`${labelClass} sm:col-span-2`}>
              Description
              <textarea required maxLength={5000} rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} className="resize-y rounded-lg border border-[#d9e2d2] bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8aaa78] focus:ring-2 focus:ring-[#dce9d4]" placeholder="Describe the equipment and what renters should know." />
            </Label>
          </div>
          {error ? <p role="alert" className="mt-4 rounded-xl border border-[#f0d6d3] bg-[#fff7f6] px-3 py-2 text-sm text-[#9a3f37]">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)} className="rounded-xl border-[#d9e2d2] bg-white">Cancel</Button>
          <Button type="submit" form="admin-equipment-form" disabled={isSaving} className={`rounded-xl bg-linear-to-r text-white ${isSaving ? "opacity-70" : ""} from-[#315c3c] to-[#6f9b5c] hover:brightness-110`}>
            {isSaving ? "Saving..." : editing ? "Save changes" : "Add to equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
