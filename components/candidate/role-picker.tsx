'use client';

import * as React from 'react';
import { Button, ChoiceChip, Field } from '@/components/ui/primitives';
import { KITCHEN_ROLES, QUALIFIED_ROLES } from '@/lib/demo/candidate';
import { normalizeTargetRoles } from '@/lib/candidate/roles';

export function CandidateRolePicker({ value, onChange, choices = [...QUALIFIED_ROLES, ...KITCHEN_ROLES] }: { value: string[]; onChange: (roles: string[]) => void; choices?: string[] }) {
  const [custom, setCustom] = React.useState('');
  const roles = normalizeTargetRoles(value);
  const add = () => {
    if (!custom.trim() || custom.trim().length > 100 || roles.length >= 10) return;
    onChange(normalizeTargetRoles([...roles, custom]));
    setCustom('');
  };
  return <section className="space-y-3 rounded-lg border border-line bg-surface p-5" aria-labelledby="desired-roles-title">
    <h2 id="desired-roles-title" className="text-lg font-semibold text-heading">Which positions are you looking for?</h2>
    <p className="text-sm text-text-secondary">Choose more than one, or add your own. You can change your next role after building your profile.</p>
    <div className="flex flex-wrap gap-2">
      {[...choices, ...roles.filter((role) => !choices.includes(role))].map((role) => <ChoiceChip key={role} selected={roles.includes(role)}
        disabled={!roles.includes(role) && roles.length >= 10}
        onClick={() => onChange(roles.includes(role) ? roles.filter((r) => r !== role) : normalizeTargetRoles([...roles, role]))}>{role}</ChoiceChip>)}
    </div>
    <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex items-end gap-2">
      <div className="min-w-0 flex-1"><Field label="Another position" value={custom} maxLength={100} onChange={(e) => setCustom(e.target.value)} placeholder="Your job title" /></div>
      <Button type="submit" variant="secondary" disabled={!custom.trim() || roles.length >= 10}>Add</Button>
    </form>
    <p className="text-xs text-text-tertiary">{roles.length ? `${roles.length} selected` : 'You can also choose after building your profile.'}</p>
  </section>;
}
