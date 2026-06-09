import { UserType } from '../types';

export function normalizeUserTypeText(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveUserTypeValue(value: unknown): UserType | undefined {
  const normalized = normalizeUserTypeText(value);

  if (!normalized) return undefined;
  if (normalized === UserType.ATHLETE || normalized === 'talent' || normalized === 'joueur') return UserType.ATHLETE;
  if (normalized === UserType.RECRUITER || normalized === 'recruiter' || normalized === 'scout' || normalized === 'agent') return UserType.RECRUITER;
  if (normalized === UserType.CLUB || normalized === 'team' || normalized === 'equipe') return UserType.CLUB;
  if (normalized === UserType.PRESS || normalized === 'press' || normalized === 'media' || normalized === 'medias' || normalized === 'journaliste') return UserType.PRESS;
  if (normalized === UserType.VISITOR || normalized === 'visitor' || normalized === 'fan') return UserType.VISITOR;
  if (normalized === UserType.ADMIN || normalized === 'administrateur') return UserType.ADMIN;

  return undefined;
}

export function resolveUserTypeFromData(data: any | undefined): UserType {
  if (data?.role === 'admin' || data?.isAdmin === true || data?.admin === true) {
    return UserType.ADMIN;
  }

  return (
    resolveUserTypeValue(
      data?.type ??
        data?.accountType ??
        data?.typeCompte ??
        data?.profileType ??
        data?.userType ??
        data?.role
    ) || UserType.VISITOR
  );
}

export function hasExplicitUserType(data: any | undefined): boolean {
  return Boolean(
    resolveUserTypeValue(
      data?.type ??
        data?.accountType ??
        data?.typeCompte ??
        data?.profileType ??
        data?.userType
    )
  );
}
