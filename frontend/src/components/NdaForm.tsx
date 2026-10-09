"use client";

import { useId, type ReactNode } from "react";
import type { NdaData, Party } from "@/lib/nda";

type Props = {
  data: NdaData;
  onChange: (data: NdaData) => void;
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function NdaForm({ data, onChange }: Props) {
  const update = <K extends keyof NdaData>(key: K, value: NdaData[K]) =>
    onChange({ ...data, [key]: value });

  const updateParty = (index: 0 | 1, key: keyof Party, value: string) => {
    const parties = [...data.parties] as NdaData["parties"];
    parties[index] = { ...parties[index], [key]: value };
    update("parties", parties);
  };

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      <Section title="Agreement">
        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            className={inputClass}
            rows={3}
            value={data.purpose}
            onChange={(e) => update("purpose", e.target.value)}
          />
        </Field>
        <Field label="Effective Date">
          <input
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
          />
        </Field>
        <TermChoice
          legend="MNDA Term"
          hint="The length of this MNDA"
          isYears={data.mndaTermType === "expires"}
          years={data.mndaTermYears}
          yearsLabel={["Expires", "year(s) from Effective Date"]}
          otherLabel="Continues until terminated"
          onSelect={(isYears) => update("mndaTermType", isYears ? "expires" : "continuous")}
          onYears={(n) => update("mndaTermYears", n)}
        />
        <TermChoice
          legend="Term of Confidentiality"
          hint="How long Confidential Information is protected"
          isYears={data.confidentialityType === "years"}
          years={data.confidentialityYears}
          yearsLabel={["For", "year(s) from Effective Date (trade secrets protected while they remain trade secrets)"]}
          otherLabel="In perpetuity"
          onSelect={(isYears) => update("confidentialityType", isYears ? "years" : "perpetual")}
          onYears={(n) => update("confidentialityYears", n)}
        />
      </Section>

      <Section title="Governing Law & Jurisdiction">
        <Field label="Governing Law" hint="State whose laws govern the MNDA">
          <input
            className={inputClass}
            placeholder="Delaware"
            value={data.governingLaw}
            onChange={(e) => update("governingLaw", e.target.value)}
          />
        </Field>
        <Field label="Jurisdiction" hint="City or county and state of the courts">
          <input
            className={inputClass}
            placeholder="New Castle, DE"
            value={data.jurisdiction}
            onChange={(e) => update("jurisdiction", e.target.value)}
          />
        </Field>
        <Field label="MNDA Modifications" hint="Optional changes to the Standard Terms">
          <textarea
            className={inputClass}
            rows={2}
            value={data.modifications}
            onChange={(e) => update("modifications", e.target.value)}
          />
        </Field>
      </Section>

      {([0, 1] as const).map((index) => (
        <Section key={index} title={`Party ${index + 1}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <input
                className={inputClass}
                value={data.parties[index].company}
                onChange={(e) => updateParty(index, "company", e.target.value)}
              />
            </Field>
            <Field label="Signatory name">
              <input
                className={inputClass}
                value={data.parties[index].name}
                onChange={(e) => updateParty(index, "name", e.target.value)}
              />
            </Field>
            <Field label="Title">
              <input
                className={inputClass}
                value={data.parties[index].title}
                onChange={(e) => updateParty(index, "title", e.target.value)}
              />
            </Field>
            <Field label="Notice address" hint="Email or postal address">
              <input
                className={inputClass}
                value={data.parties[index].noticeAddress}
                onChange={(e) => updateParty(index, "noticeAddress", e.target.value)}
              />
            </Field>
          </div>
        </Section>
      ))}
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-2 text-base font-semibold text-zinc-900">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-zinc-700">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      {children}
    </label>
  );
}

type TermChoiceProps = {
  legend: string;
  hint: string;
  isYears: boolean;
  years: number;
  /** Text around the number input, e.g. ["Expires", "year(s) from Effective Date"]. */
  yearsLabel: [before: string, after: string];
  otherLabel: string;
  onSelect: (isYears: boolean) => void;
  onYears: (years: number) => void;
};

/** Radio group: "N year(s) ..." with a number input, or an open-ended alternative. */
function TermChoice({ legend, hint, isYears, years, yearsLabel, otherLabel, onSelect, onYears }: TermChoiceProps) {
  const name = useId();
  return (
    <fieldset className="space-y-2 text-sm text-zinc-800">
      <legend className="text-sm font-medium text-zinc-700">{legend}</legend>
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} checked={isYears} onChange={() => onSelect(true)} />
          <span>{yearsLabel[0]}</span>
        </label>
        <input
          type="number"
          min={1}
          step={1}
          className={`${inputClass} w-20`}
          value={years || ""}
          disabled={!isYears}
          onChange={(e) => onYears(Number(e.target.value))}
          aria-label={`${legend}: number of years`}
        />
        <span>{yearsLabel[1]}</span>
      </div>
      <label className="flex items-center gap-2">
        <input type="radio" name={name} checked={!isYears} onChange={() => onSelect(false)} />
        <span>{otherLabel}</span>
      </label>
    </fieldset>
  );
}
