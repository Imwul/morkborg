// Search admission remains unchanged. Display has its own policy and never reads
// this certification function; both consume the same whole-title evidence.
export {
  indexReferenceTitleEvidence as indexTrustedReferenceTitles,
  registryReferenceTitleEvidence as trustedReferenceSearchTitle,
  type OwnedReferenceTitle as TrustedSearchTitle,
} from './referenceTitleEvidence';
