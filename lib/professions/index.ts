import type { Profession, ProfessionId } from "./types";
import { hostess } from "./hostess";
import { waiter } from "./waiter";
import { manager } from "./manager";
import { chef } from "./chef";

export * from "./types";
export * from "./universal";

/**
 * Реестр профессий.
 *
 * Порядок здесь — порядок на экране выбора. Добавить бармена или су-шефа
 * по выпечке значит дописать один файл рядом и одну строку сюда; ни один
 * экран при этом не меняется.
 */
export const PROFESSIONS: readonly Profession[] = [
  waiter,
  hostess,
  chef,
  manager,
];

export const PROFESSION_BY_ID: Record<ProfessionId, Profession> = {
  waiter,
  hostess,
  chef,
  manager,
};

export function getProfession(
  id: string | null | undefined,
): Profession | null {
  if (!id) return null;
  return PROFESSION_BY_ID[id as ProfessionId] ?? null;
}
