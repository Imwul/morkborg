/** Describes an evidenced source relationship, never an instruction to act. */
export function RelationshipLabel({
  kind,
}: {
  kind?: 'FOLLOW-UP' | 'SUBTABLE' | 'LOOKUP' | 'USES' | 'USED BY';
}) {
  return kind ? <span className="relationship-label">{kind}</span> : null;
}
