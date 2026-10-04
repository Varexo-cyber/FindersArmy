/** Age in whole years on a given date (UTC calendar dates; birthdays count from the day itself). */
export function ageOn(birth: Date, on: Date): number {
  let age = on.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < birth.getUTCMonth() || (on.getUTCMonth() === birth.getUTCMonth() && on.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export type AgeCheck = "OK" | "NEEDS_PARENT" | "TOO_YOUNG";

/** 18+ may join. 16–17 only with the ALLOW_16_PLUS flag and a parent's consent. */
export function checkFinderAge(birth: Date, on: Date, allow16Plus: boolean): AgeCheck {
  const age = ageOn(birth, on);
  if (age >= 18) return "OK";
  if (allow16Plus && age >= 16) return "NEEDS_PARENT";
  return "TOO_YOUNG";
}
