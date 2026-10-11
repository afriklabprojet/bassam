# Décision produit requise — téléphone renvoyé par `GET /api/orders/[id]/status`

**Aucun changement de comportement n'est inclus dans cette décision.** La route
continue de renvoyer le numéro complet ; son commentaire et ses cinq tests de
caractérisation décrivent maintenant ce contrat.

## Constat local

- La route est publique et lit la commande par UUID avec le client de service.
  Ce contournement de la RLS permet aux commandes invitées (`user_id = null`)
  d'afficher leur confirmation.
- L'UUID est la seule capacité d'accès. Toute personne qui obtient l'URL de
  confirmation peut interroger la route sans authentification.
- La réponse contient `orderId`, `status`, `paymentStatus`, `totalAmount`,
  `firstName`, `phone` (numéro complet) et `createdAt`.
- L'adresse complète, l'e-mail, l'identifiant utilisateur et les lignes de
  commande ne sont pas renvoyés.
- L'UUID peut se retrouver dans l'historique du navigateur, des captures
  d'écran, des messages transférés ou des journaux. Il réduit le risque
  d'énumération mais ne prouve ni l'identité ni la propriété de la commande.
- Aucune limitation de débit spécifique à cette route n'a été démontrée.

## Options

| Option | Effet | Coût |
|---|---|---|
| A. Conserver | Aucun changement fonctionnel | Le numéro complet reste visible pour tout détenteur du lien |
| B. Masquer | L'API et la page affichent seulement une forme masquée | Modifier ensemble la route, la page et les tests |
| C. Retirer | La page n'affiche plus le numéro renvoyé par l'API | Modifier ensemble la route, la page et les tests |
| Complément : limiter le débit | Réduit l'impact d'une tentative d'énumération | Changement applicatif distinct |

## Recommandation

Choisir explicitement l'option B avant tout changement fonctionnel. La
modification devra être validée avec la page de confirmation et les tests. Tant
que cette décision n'est pas prise, le contrat existant reste inchangé.

## Limite de validation

Les tests locaux vérifient la forme de la réponse et l'absence des champs non
prévus. Ils ne prouvent ni la confidentialité d'un lien partagé, ni le
comportement d'un déploiement Vercel, ni celui d'une pile Supabase réelle.
