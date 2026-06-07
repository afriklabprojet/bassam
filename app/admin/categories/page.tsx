import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function CategoriesAdminPage() {
  return (
    <TaxonomyManager
      apiPath="/api/admin/categories"
      title="Catégories produit"
      subtitle="Gérez les catégories métier du catalogue ({count})."
      singularLabel="Catégorie"
      emptyMessage="Aucune catégorie. Créez-en une avec le bouton ci-dessus."
      namePlaceholder="Ex : Homme"
      nameHelp="Exemples: Homme, Femme, Mixte. Vous pouvez aussi créer des catégories plus fines si votre catalogue évolue."
      slugHintTemplate="Utilisé dans les filtres publics et l'URL : /collections/{slug}"
      orderHelp="Les catégories s'affichent du plus petit au plus grand."
      deleteConfirmationTemplate={'Supprimer la catégorie "{name}" ?\n\nLes produits rattachés devront être recatégorisés avant suppression.'}
      deleteBlockedHint="Supprimez ou reconfigurez d'abord les produits liés à cette catégorie."
      imageLabel="Image de la catégorie"
    />
  );
}
