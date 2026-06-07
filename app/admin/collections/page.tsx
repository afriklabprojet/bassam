import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function AdminCollectionsPage() {
  return (
    <TaxonomyManager
      apiPath="/api/admin/product-collections"
      title="Collections produit"
      subtitle="Gérez les collections commerciales du catalogue ({count})."
      singularLabel="Collection"
      emptyMessage="Aucune collection. Créez-en une avec le bouton ci-dessus."
      namePlaceholder="Ex : Extrait Concentré"
      nameHelp="Exemples: Extrait Concentré, Collection Privée Gazelle, Collection Privée Convivium, Collection Manel."
      slugHintTemplate="Identifiant interne de la collection : {slug}"
      orderHelp="Les collections s'affichent du plus petit au plus grand."
      deleteConfirmationTemplate={'Supprimer la collection "{name}" ?\n\nLes produits rattachés devront être déplacés avant suppression.'}
      deleteBlockedHint="Supprimez ou reconfigurez d'abord les produits liés à cette collection."
      imageLabel="Image de la collection"
    />
  );
}