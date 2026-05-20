export const DOC_TYPES = {
  residence: "Certificat de résidence",
  vie: "Certificat de vie",
  bonne_conduite: "Certificat de bonne conduite",
  naissance: "Déclaration de naissance",
  celibat: "Certificat de célibat",
  vente: "Certificat de vente",
  deces: "Déclaration de décès",
  autre: "Autre acte",
} as const;

export type DocType = keyof typeof DOC_TYPES;

export const SEX_LABEL = { M: "Masculin", F: "Féminin" } as const;

export const MARITAL_LABEL = {
  single: "Célibataire",
  married: "Marié(e)",
  divorced: "Divorcé(e)",
  widowed: "Veuf/Veuve",
} as const;

export function makeDocNumber(type: DocType) {
  const now = new Date();
  const y = now.getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  const code = type.toUpperCase().slice(0, 3);
  return `FNS-${code}-${y}-${seq}`;
}
