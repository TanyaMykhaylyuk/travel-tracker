export function landmarkVisitKey(countryVisitKey: string, landmarkId: string): string {
  return `${countryVisitKey}:${landmarkId}`;
}
