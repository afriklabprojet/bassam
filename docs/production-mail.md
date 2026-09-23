# Configuration mail de production

Les commandes, formulaires de contact, consultations et campagnes utilisent Resend.

## Adresses

- Expéditeur : `VIP Parfumerie Bar <contact@vipparfumeriebar.com>`
- Contact et consultations : `contact@vipparfumeriebar.com`
- Notifications de commande : `commande@vipparfumeriebar.com`

## 1. Vérifier le domaine dans Resend

1. Dans Resend, ouvrir **Domains** puis ajouter `vipparfumeriebar.com`.
2. Ajouter chez le fournisseur DNS les enregistrements SPF et DKIM fournis par Resend.
3. Attendre que le domaine passe à l'état **Verified**.
4. Dans **API Keys**, créer une clé avec permission d'envoi.

Les valeurs DNS doivent être copiées depuis Resend : elles sont propres au compte et ne doivent pas être inventées.

## 2. Configurer Vercel

Dans **Project Settings > Environment Variables**, ajouter pour **Production** :

```text
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=VIP Parfumerie Bar <contact@vipparfumeriebar.com>
NEXT_PUBLIC_SUPPORT_EMAIL=contact@vipparfumeriebar.com
```

`RESEND_API_KEY` est un secret. Ne jamais l'ajouter au dépôt ni la transmettre dans une conversation.

Après modification des variables, redéployer la production. Les variables Vercel ne sont pas appliquées à un déploiement déjà construit.

## 3. Contrôler la configuration

Pour contrôler une configuration locale dans `.env.local` :

```bash
npm run mail:check
```

Le script ne révèle jamais la clé. Il vérifie sa présence, les adresses et le statut du domaine auprès de Resend.
Après avoir ajouté ou corrigé les DNS, demander une nouvelle vérification avec `npm run mail:check -- --verify`.

Pour contrôler Vercel sans afficher les valeurs secrètes :

```bash
vercel env ls production
```

## 4. Test réel

Après redéploiement :

1. Envoyer le formulaire de contact et confirmer sa réception à `contact@vipparfumeriebar.com`.
2. Effectuer une commande de test payée.
3. Confirmer que le client reçoit la confirmation avec sa facture PDF.
4. Confirmer que `commande@vipparfumeriebar.com` reçoit la copie vendeur avec la facture PDF.

Une commande ne déclenche les e-mails qu'après confirmation du paiement par le webhook Jeko.