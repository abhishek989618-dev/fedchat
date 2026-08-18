
export function normalizePhone(
  phone?: string
): string | undefined {
  if (!phone) {
    return undefined;
  }

  const normalized =
    phone.replace(/[\s()-]/g, "");

  if (
    !/^\+[1-9]\d{7,14}$/.test(
      normalized
    )
  ) {
    throw new Error(
      "Invalid phone number format"
    );
  }

  return normalized;
}

