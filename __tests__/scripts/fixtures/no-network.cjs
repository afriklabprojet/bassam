// Préchargé (NODE_OPTIONS=--require) par les tests de ligne de commande : toute tentative de requête réseau échoue
// immédiatement avec un code de sortie reconnaissable. Garantit qu'une simulation n'envoie rien.
const blocked = () => {
  process.stderr.write('NETWORK_ATTEMPT\n');
  process.exit(99);
};
globalThis.fetch = blocked;
