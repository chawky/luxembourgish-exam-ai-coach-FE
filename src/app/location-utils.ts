import { LocationSuggestion, User } from './models';

export interface AddressFields {
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
}

export function displayName(user: Partial<User>): string {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || user.username?.trim() || user.email?.trim() || '';
}

export function formatAddress(user: Partial<User>): string {
  const streetLine = [user.streetNumber, user.street]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const cityLine = [formatPostalCode(user.postalCode), user.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return [streetLine, cityLine, user.addressInfo]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

export function parseLocationSuggestion(
  suggestion: LocationSuggestion,
): AddressFields {
  const label = suggestion.label?.trim() ?? '';
  const layerName = suggestion.layerName?.toLowerCase() ?? '';
  const addressMatch = label.match(
    /^(?:(?<streetNumber>[^,]+),\s*)?(?<street>.*?),\s*L-(?<postalCode>\d{4})\s+(?<city>.+)$/,
  );

  if (addressMatch?.groups) {
    return {
      streetNumber: addressMatch.groups['streetNumber']?.trim(),
      street: addressMatch.groups['street']?.trim(),
      postalCode: addressMatch.groups['postalCode']?.trim(),
      city: addressMatch.groups['city']?.trim(),
    };
  }

  const streetMatch = label.match(/^(?<street>.+?)\s*\((?<city>.+)\)$/);
  if (streetMatch?.groups) {
    return {
      street: streetMatch.groups['street']?.trim(),
      city: streetMatch.groups['city']?.trim(),
    };
  }

  if (layerName.includes('commune') || label) {
    return { city: label };
  }

  return {};
}

function formatPostalCode(postalCode?: string): string {
  const value = postalCode?.trim();
  return value ? `L-${value.replace(/^L-/i, '')}` : '';
}
